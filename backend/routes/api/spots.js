const express = require('express');
const bcrypt = require('bcryptjs');


const { setTokenCookie, requireAuth } = require('../../utils/auth');
const { User, Spot, Review, SpotImage, ReviewImage, Booking } = require('../../db/models');

const { check } = require('express-validator');
const { handleValidationErrors } = require('../../utils/validation');

const router = express.Router();

const validateSpot = [
  check('address')
    .exists({ checkFalsy: true })
    .withMessage(`Street address is required`),
  check('city')
    .exists({ checkFalsy: true })
    .withMessage(`City is required`),
  check('state')
    .exists({ checkFalsy: true })
    .withMessage(`State is required`),
  check('country')
    .exists({ checkFalsy: true })
    .withMessage(`Country is required`),
  check('description')
    .exists({ checkFalsy: true })
    .withMessage(`Description is required`),
  check('price')
    .isInt({ min: 1 })
    .withMessage(`Price per day is required`),
  check('lat')
    .isFloat({ min: -90, max: 90 })
    .withMessage(`Latitude is not valid`),
  check('lng')
    .isFloat({ min: -180, max: 180 })
    .withMessage(`Longitude is not valid`),
  check('name')
    .isLength({ max: 50 })
    .withMessage(`Name must be less than 50 characters`),
  handleValidationErrors
]

const validateReview = [
  check('review')
    .exists({ checkFalsy: true })
    .withMessage(`Review text is required`),
  check('stars')
    .isInt({min: 1, max: 5})
    .withMessage(`Stars must be an integer from 1 to 5`),
  handleValidationErrors
]

//Get ALL Spots
router.get(
  '',
  async (req, res) => {
    const spots = await Spot.findAll({
      include: [
        {
          model: Review,
          // attributes: []
          // include: [
          //   {
          //     model: ReviewImage,
          //     attributes: ['previewImage']
          //   }
          // ]
        },
        {
          model: SpotImage
        }
      ]
      // attributes: [
      //   [sequelize.fn('AVG', sequelize.col('stars')),
      //     'avgRating']
      // ],
      // raw: true
    });
    // const reviews = await Review.findAll({
    // })

    let allSpots = [];
    spots.forEach(spot => {
      allSpots.push(spot.toJSON())
    })
    // console.log(allSpots)
    allSpots.forEach(spot => {
      let total = 0;
      spot.Reviews.forEach(review => {
        // console.log(review)
        total += review.stars
      })
      spot.SpotImages.forEach(spotImage => {
        // console.log(spotImage)
        if (spotImage.preview) {
          spot.previewImage = spotImage.url
        }
      })
      spot.avgRating = total / spot.Reviews.length
      delete spot.Reviews
      delete spot.SpotImages
    })

    // const reviews = spots.Reviews;

    // const totalReviewStars = await Review.sum('stars')
    // const reviewCount = await Review.count()
    // const avgRating = totalReviewStars / reviewCount


    res.json({ Spots: allSpots })
  }
);

//Get all Spots for Current User
router.get(
  '/current',
  requireAuth,
  async (req, res) => {
    const user = req.user.id
    const userSpots = await Spot.findAll({
      include: [
        {
          model: Review
        },
        {
          model: SpotImage
        }
      ],
      where: {
        ownerId: user
      }
    })
    let allSpots = [];
    userSpots.forEach(spot => {
      allSpots.push(spot.toJSON())
    })
    allSpots.forEach(spot => {
      let total = 0;
      spot.Reviews.forEach(review => {
        total += review.stars
      })
      spot.SpotImages.forEach(spotImage => {
        // console.log(spotImage)
        if (spotImage.preview) {
          spot.previewImage = spotImage.url
        }
      })
      spot.avgRating = total / spot.Reviews.length
      delete spot.Reviews
      delete spot.SpotImages
    })
    if (userSpots && userSpots.length !== 0) {
      res.json({
        Spots: allSpots
      })
    } else {
      res.status(404);
      return res.json({
        message: `No spots owned`
      })
    }
  }
)

//Add an Image to a Spot
router.post(
  '/:spotId/images',
  requireAuth,
  async (req, res) => {
    const ownerId = req.user.id
    if (!ownerId) {
      res.status(401);
      return res.json({
        message: "Authentication required"
      })
    }
    const { url, preview } = req.body;
    let spot = await Spot.findByPk(req.params.spotId, {
      include: [
        {
          model: SpotImage
        }
      ]
    });
    // console.log('spot', spot)
    if (!spot) {
      res.status(404)
      return res.json({
        message: "Spot couldn't be found"
      })
    }
    // console.log('owner', spot.ownerId)
    if (ownerId !== spot.ownerId) {
      res.status(403);
      return res.json({
        message: "Forbidden"
      })
    }
    if (ownerId === spot.ownerId) {
      // console.log(spot.ownerId)
      let spotId = spot.id;
      let image = await SpotImage.create({ spotId, url, preview });
      // console.log(image.spotId)
      const newImage = {
        id: image.id,
        spotId: spot.id,
        url: image.url,
        preview: image.preview
      }

      res.json(newImage)
    }
    // console.log(spot.SpotImages)
  }
)

//Get All Reviews by Spot ID
router.get(
  '/:spotId/reviews',
  async (req, res) => {
    const spot = await Spot.findByPk(req.params.spotId)
    const reviews = await Review.findAll({
      include: [
        {
          model: User,
          attributes: ['id', 'firstName', 'lastName']
        },
        {
          model: ReviewImage,
          attributes: ['id', 'url']
        }
      ],
      where: {
        spotId: req.params.spotId
      }
    })
    if (!spot) {
      res.status(404);
      return res.json({
        message: `Spot couldn't be found`
      })
    }
    res.json({
      Reviews: reviews
    })
  }
)

//Create a Review for Spot based on Spot's ID
router.post(
  '/:spotId/reviews',
  validateReview,
  requireAuth,
  async (req, res) => {
    const userId = req.user.id
    // if (!user) {
    //   res.status(401);
    //   return res.json({
    //     message: "Authetication required"
    //   })
    // }
    const spotId = req.params.spotId;
    const { review, stars } = req.body
    let spot = await Spot.findByPk(req.params.spotId, {
      include: [
        {
          model: Review
        }
      ]
    });
    if (!spot) {
      res.status(404)
      return res.json({
        message: "Spot couldn't be found"
      })
    }
    let reviewedBy = []
    spot.Reviews.forEach(review => {
      // console.log(review.userId)
      reviewedBy.push(review.userId)
      if (userId === review.userId) {
        res.status(500);
        return res.json({
          message: "User already has a review for this spot"
        })
      }
    })
    // console.log('reviewed', reviewedBy)
    if (userId === spot.ownerId) {
      res.status(403);
      return res.json({
        message: "Owner cannot submit review"
      })
    }
    if (!reviewedBy.includes(userId)) {
      let userReview = await Review.create({ userId, spotId, review, stars });
      // console.log(userReview.id)
      const newReview = {
        id: userReview.id,
        userId: userId,
        spotId: spot.id,
        review: userReview.review,
        stars: userReview.stars
      }

      return res.json(userReview)
    }

  }
)

//Get All Bokings for a Spot based on Spot ID
router.get(
  '/:spotId/bookings',
  requireAuth,
  async (req, res) => {
    const user = req.user.id
    const spot = await Spot.findByPk(req.params.spotId)
    if (!spot) {
      res.status(404);
      return res.json({
        message: `Spot couldn't be found`
      })
    }
    if (user === spot.ownerId) {
    const booking = await Booking.findAll({
      include: [
        {
          model: User,
          attributes: ['id', 'firstName', 'lastName']
        }
      ],
      attributes: ['id', 'spotId', 'userId', 'startDate', 'endDate', 'createdAt', 'updatedAt'],
      where: {
        spotId: spot.id
      }
    })
    return res.json({
      Bookings: booking
    })
    }
    if (user !== spot.ownerId) {
      const booking = await Booking.findAll({
        attributes: ['spotId', 'startDate', 'endDate'],
        where: {
          spotId: spot.id
        }
      })
      return res.json({
        Bookings: booking
      })
    }
  }
)

//Create a Booking for a Spot based on Spot ID
router.post(
  '/:spotId/bookings',
  requireAuth,
  async (req, res) => {
    const userId = req.user.id;
    // console.log(user)
    const spot = await Spot.findByPk(req.params.spotId, {
      include: [
        {
          model: Booking
        }
      ]
    });
    if (!spot) {
      res.status(404)
      return res.json({
        message: "Spot couldn't be found"
      })
    }
    if (userId === spot.ownerId) {
      res.status(404)
      return res.json({
        message: "User owns this spot"
      })
    }
    const { startDate, endDate } = req.body;
    // console.log('start', startDate)
    // console.log('end', endDate)
    const startDateString = new Date(startDate).toDateString()
    // console.log('start', startDateString)
    const startDateObj = new Date(startDateString).getTime()
    // console.log('start', startDateObj)
    const endDateString = new Date(endDate).toDateString()
    // console.log('end', endDateString)
    const endDateObj = new Date(endDateString).getTime()
    // console.log('end', endDateObj)
    if (startDateObj >= endDateObj) {
      res.status(400);
      return res.json({
        message: "endDate cannot be on or before startdate"
      })
    }
    if (startDateObj < new Date().getTime() || endDateObj < new Date().getTime()) {
      res.status(400);
      return res.json({
        message: "Start or End date cannot be before current day"
      })
    }

    // console.log(spot)
    // console.log('bookings', spot.Bookings);
    spot.Bookings.forEach(booking => {
      // console.log('booking start', booking.startDate.getTime())
      // console.log('booking end', booking.endDate)
      let startDate = booking.startDate.getTime();
      let endDate = booking.endDate.getTime();
      if (startDateObj >= startDate && startDateObj <= endDate) {
        res.status(403);
        return res.json({
          message: "Sorry, this spot is already booked for the specified dates",
          errors: {
            startDate: "Start date conflicts with an existing booking"
          }
        })
      }
      if (endDateObj >= startDate && endDateObj <= endDate) {
        res.status(403);
        return res.json({
          message: "Sorry, this spot is already booked for the specified dates",
          errors: {
            endDate: "End date conflicts with an existing booking"
          }
        })
      }
    })

    let spotId = spot.id
    // console.log('spotId', spotId)

    const userBooking = await Booking.create({spotId, userId, startDate, endDate})
    const newBooking = {
      id: userBooking.id,
      spotId: spotId,
      userId: userId,
      startDate: userBooking.startDate,
      endDate: userBooking.endDate
    }
    console.log('spot', spot.Bookings)
    return res.json(userBooking)
  }
)

//Get details of a Spot from an ID
router.get(
  '/:spotId',
  async (req, res, next) => {

    const spot = await Spot.findByPk(req.params.spotId, {
      include: [
        {
          model: User,
          attributes: ['id', 'firstName', 'lastName']
        },
        {
          model: SpotImage,
          attributes: ['id', 'url', 'preview']
        },
        {
          model: Review,
        }
      ]
    })
    if (!spot) {
      res.status(404)
      return res.json({
        message: `Spot couldn't be found`
      })
    }
    let currentSpot = spot.toJSON();

    currentSpot.Owner = currentSpot.User;
    delete currentSpot.User;

    let reviews = spot.Reviews;
    // console.log(spot.Reviews)
    let numReviews = reviews.length;
    // console.log(reviewCount)
    let total = 0;
    let totalReviewStars = reviews.forEach(review => {
      total += review.stars;
    })
    // console.log(total)
    currentSpot.numReviews = numReviews;
    currentSpot.avgStarRating = total / numReviews;
    // console.log(avgStarRating)
    delete currentSpot.Reviews

    // console.log(currentSpot)
    res.json(currentSpot)
  }
)

//Create a Spot
router.post(
  '',
  validateSpot,
  requireAuth,
  async (req, res) => {
    const ownerId = req.user.id;

    const { address, city, state, country, lat, lng, name, description, price } = req.body;
    if (ownerId) {
      const spot = await Spot.create({ ownerId, address, city, state, country, lat, lng, name, description, price });

      const newSpot = {
        id: spot.id,
        ownerId: ownerId,
        address: spot.address,
        city: spot.city,
        country: spot.country,
        lat: spot.lat,
        lng: spot.lng,
        name: spot.name,
        description: spot.description,
        price: spot.price
      }

      return res.json(spot)
    } else {
      res.status(403)
      return res.json({
        message: "Forbidden"
      })
    }
  }
)

//EDIT a Spot
router.put(
  '/:spotId',
  validateSpot,
  requireAuth,
  async (req, res) => {
    const ownerId = req.user.id
    // console.log(user);
    if (!ownerId) {
      res.status(401);
      return res.json({
        message: "Authentication required"
      })
    }
    let spot = await Spot.findByPk(req.params.spotId);
    if (!spot) {
      res.status(404)
      return res.json({
        message: "Spot couldn't be found"
      })
    }
    // console.log('spot ownerId', spot.ownerId)
    if (ownerId !== spot.ownerId) {
      res.status(403);
      return res.json({
        message: "Forbidden"
      })
    }
    // console.log('spot before', spot)
    const { address, city, state, country, lat, lng, name, description, price } = req.body;
    if (ownerId === spot.ownerId) {
      if (address) spot.address = address;
      if (city) spot.city = city;
      if (state) spot.state = state;
      if (country) spot.country = country;
      if (lat) spot.lat = lat;
      if (lng) spot.lng = lng;
      if (name) spot.name = name;
      if (description) spot.description = description;
      if (price) spot.price = price;
    }

    await spot.save()
    // console.log('spot after', spot)

    res.json(spot)
  }
)

//DELETE a Spot
router.delete(
  '/:spotId',
  requireAuth,
  async (req, res) => {
    const ownerId = req.user.id
    // console.log(user);
    if (!ownerId) {
      res.status(401);
      return res.json({
        message: "Authentication required"
      })
    }
    let spot = await Spot.findByPk(req.params.spotId);
    if (!spot) {
      res.status(404)
      return res.json({
        message: "Spot couldn't be found"
      })
    }
    if (ownerId !== spot.ownerId) {
      res.status(403);
      return res.json({
        message: "Forbidden"
      })
    }

    if (ownerId === spot.ownerId) {
      await spot.destroy()
    }
    res.json({
      message: "Successfully deleted"
    })
  }
)

module.exports = router;
