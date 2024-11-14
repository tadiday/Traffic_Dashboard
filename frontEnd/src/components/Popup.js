import React from 'react'
import './Popup.css'
import closeIcon from './icons/close.png';

function Popup(props) {
  return (props.trigger)?(
    <div className="popup">
        <div className="popup-inner">
            <img className="close-img" src={closeIcon} onClick={() => props.setTrigger(false)}></img>
            {props.children}
        </div>
    </div>
  ): "";
}

export default Popup