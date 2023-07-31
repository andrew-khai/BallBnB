import React from 'react';
import { NavLink } from 'react-router-dom';
import "./SpotItemDetails.css"

const SingleSpotItem = ({ spot }) => {
  return (
    <div className="spots-boxes" key={spot.id}>
      <NavLink to={`/spots/${spot.id}`}>
        <img className="spots-boxes-image" src={spot.previewImage} alt={spot.name}></img>
        <div className="spots-boxes-details">
          <div className="spots-location-ratings">
            <div className="spots-boxes-city-state">{spot.city}, {spot.state}</div>
            <div className="spots-boxes-ratings"><i className="fa-solid fa-star fa-xs"></i> {spot.avgRating}</div>
          </div>
          <div className="spots-boxes-price">${spot.price}<span className="day-text"> /day</span></div>
        </div>
      </NavLink>
    </div>
  )
}

export default SingleSpotItem;