import React from 'react';
import { NavLink } from 'react-router-dom';
import { useSelector } from 'react-redux';
import ProfileButton from './ProfileButton';
import './Navigation.css';
import LoginFormModal from '../LoginFormModal';
import SignupFormModal from '../SignupFormModal';
import OpenModalButton from '../OpenModalButton';

function Navigation({ isLoaded }) {
  const sessionUser = useSelector(state => state.session.user);

  let sessionLinks;
  if (sessionUser) {
    sessionLinks = (
      <li>
        <ProfileButton user={sessionUser} />
      </li>
    );
  } else {
    sessionLinks = (
      <li>
        <OpenModalButton
          buttonText="Log In"
          modalComponent={<LoginFormModal />}
        />
        <OpenModalButton
          buttonText="Sign Up"
          modalComponent={<SignupFormModal />}
        />
      </li>
    );
  }

  return (
    <ul id='navigation-list'>
      <li className='navigation-bar home-link'>
        <NavLink exact to="/"><i className="fa-solid fa-basketball fa-2xl" style={{ color: 'orange' }}></i>BallBnB</NavLink>
      </li>
      <div id='searchbar-container'>
        <input
          className='searchbar-inputs city-input'
          type="text"
          placeholder="City"
          disabled={true}
        />
        <h2 className="navi-line">|</h2>
        <input
          className='searchbar-inputs city-input'
          type='text'
          placeholder="State"
          disabled={true}
        />
        <h2 className="navi-line">|</h2>
        <input
          className='searchbar-inputs'
          type="text"
          placeholder="Country"
          disabled={true}
        />
        <button id="searchbar-button"><i class="fa-solid fa-magnifying-glass" style={{color: "#ffffff"}}></i></button>
      </div>
      {sessionUser && isLoaded ? (
        <div id="user-logged-in-profile">
          <li className='create-new-spot-link'>
            <NavLink to='/spots/new'>Create a New Spot</NavLink>
          </li>
          <li className='navigation-bar'>
            <ProfileButton user={sessionUser} />
          </li>
        </div>
      ) : (
        <li className='navigation-bar'>
          <ProfileButton user={sessionUser} />
        </li>
      )}
    </ul>
  );
}

export default Navigation;
