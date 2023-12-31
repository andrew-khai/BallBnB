import './SingleSpotReviews.css'
import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { useParams } from 'react-router-dom/cjs/react-router-dom.min';
import DeleteReviewModal from '../DeleteReviewModal';
import OpenModalButton from '../OpenModalButton';

const SingleSpotReview = ({ review }) => {
  const { spotId } = useParams();
  const [isOwner, setIsOwner] = useState(false);
  const [hasReviewed, setHasReviewed] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const sessionUser = useSelector(state => state.session.user);
  const spot = useSelector(state => state.spots.singleSpot)
  // console.log('sessionId', sessionUser.id)
  // console.log('owner', spot[spotId].ownerId)
  // console.log('review', review.User.firstName)
  // console.log(hasReviewed)
  // console.log('the review ishere', review)

  useEffect(() => {
    if (sessionUser) {
      setIsLoggedIn(true);
    }
    if (sessionUser) {
      if (sessionUser?.id === spot?.ownerId) setIsOwner(true)
      if (sessionUser?.id === review.User?.id) setHasReviewed(true);
    }
  }, [spotId, sessionUser, isLoggedIn])

  // console.log(isOwner)
  // console.log(hasReviewed)
  // console.log('logged in', isLoggedIn)

  return (
    <>
      {!sessionUser ?
        <div className='reviews-container'>
          <h3>{review?.User.firstName}</h3>
          <p>{review.createdAt.slice(0, 10)}</p>
          <p>{review.review}</p>
          {/* {sessionUser.id === review.User.id &&
          <OpenModalButton
            buttonText="Delete"
            modalComponent={<DeleteReviewModal review={review} />}
          />
        } */}
        </div> :
        <div className='reviews-container'>
          {review && review.User &&
            <h3>{review.User.firstName}</h3>
          }
          <p>{review.createdAt.slice(0, 10)}</p>
          <p>{review.review}</p>
          {sessionUser?.id === review.User?.id &&
            <OpenModalButton
              buttonText="Delete"
              modalComponent={<DeleteReviewModal review={review} />}
            />
          }
        </div>
      }
    </>
  )

}

export default SingleSpotReview;
