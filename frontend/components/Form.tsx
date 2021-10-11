import * as React from 'react';
import PropTypes from 'prop-types';

export default function Form({ onSubmit }) {

  const fieldset = React.createRef<HTMLFieldSetElement>(); 
  const [newStatus, setNewStatus] = React.useState(""); 

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setNewStatus("") 
    onSubmit(newStatus, fieldset.current)
  }

  const updateNewStatus = (event: React.ChangeEvent<HTMLInputElement>) => {    
    setNewStatus(event.target.value);  
  }

  return (
    <form onSubmit={handleSubmit}>
      <fieldset id="fieldset" ref={fieldset}>
        <p>Add or update your status message!</p>
        <p className="highlight">
          <label htmlFor="message">Message:</label>
          <input
            autoComplete="off"
            autoFocus
            required
            value={newStatus}
            onChange={updateNewStatus}
          />
        </p>
        <button type="submit">
          Update
        </button>
      </fieldset>
    </form>
  );
}

Form.propTypes = {
  onSubmit: PropTypes.func.isRequired,
};
