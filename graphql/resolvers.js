const bcrypt = require('bcryptjs');
const validator = require('validator');
const jwt = require('jsonwebtoken');

const User = require('../models/user');
const Post = require('../models/post');

module.exports = {
  createUser: async function({ userInput }, req) {
    //const email = args.userInput.email;
    const errors = [];
        if (!validator.isEmail(userInput.email)) {
        errors.push({message: 'Invalid Email.'})
        }
        
        if (errors.length > 0) {
            const error = new Error('Invalid Inputs');
            throw error;
        }
    const existingUser = await User.findOne({ email: userInput.email });
    if (existingUser) {
      const error = new Error('User exists already!');
      throw error;
    }
    const hashedPw = await bcrypt.hash(userInput.password, 12);
    const user = new User({
      email: userInput.email,
      name: userInput.name,
      password: hashedPw
    });
    const createdUser = await user.save();
    return { ...createdUser._doc, _id: createdUser._id.toString() };
    },
    login: async function ({ email, password }) {
        const user = await User.findOne({ email: email });
        if (!user) {
            const error = new Error('User not found.');
            throw error;
        }
        const isEqual = await bcrypt.compare(password, user.password);
        if (!isEqual) {
            const error = new Error('Password is incorrect.');
            throw error;
        }

        const token = jwt.sign({ userId: user._id.toString(), email: user.email }, 'todays_sky_is!dark&&blue', { expiresIn: '8h' });
        return {token: token, userId: user._id.toString()}
    },
    createPost: async function ({ postInput }, req) {
        const errors = [];
        if (!req.isAuth) {
            const error = new Error('Not authenticated!');
            throw error;
          }
        if (validator.isEmpty(postInput.title) || !validator.isLength(postInput.title, {min: 5})) {
            errors.push({message: 'Title is invalid.'})
        }
        if (validator.isEmpty(postInput.content) || !validator.isLength(postInput.content, {min: 5})) {
            errors.push({message: 'Content is invalid.'})
        }
        
        if (errors.length > 0) {
            const error = new Error('Invalid Inputs');
            throw error;
        }

        const post = new Post({
            title: postInput.title,
            content: postInput.content,
            imageUrl: postInput.imageUrl,
            creator: req.user
        });

        const createdPost = await post.save();
        user.posts.push(createdPost);
        await user.save();
        return {
            ...createdPost._doc, _id: createdPost._id.toString(), createdAt: createdPost.createdAt.toISOString()
        };
    },
    post: async function (args, req) {
        const errors = [];
        if (!req.isAuth) {
            const error = new Error('Not authenticated!');
            throw error;
        } 
        if (!page) {
            page = 1;
        }
        const perPage = 10;
        const totalPosts = await Post.find().countDocuments();
        const posts = await Post.find().sort({ createdAt: -1 }).skip(( page - 1 ) * perPage).limit(perPage).populate('creator');
        return {
            totalPosts: totalPosts, posts: posts.map(post => {
                return {
                    ...post._doc, _id: post._id.toString(), createdAt: post.createdAt.toISOString()
                }
            })
        }
    }
};
