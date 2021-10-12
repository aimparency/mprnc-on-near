import "regenerator-runtime";
import * as React from "react";
import PropTypes from "prop-types";
import Big from "big.js";
import Form from "./components/Form";

const BOATLOAD_OF_GAS = Big(3).times(10 ** 13).toFixed();

const App = ({ contract, currentUser, nearConfig, wallet }) => {

  const [status, setStatus] = React.useState();

  React.useEffect(() => {
    if (currentUser) {
      contract.get_status({
        account_id: currentUser.accountId
      }).then(setStatus)
    }
  });

  const onSubmit = async (newStatus: String, fieldset: HTMLFieldSetElement) => {
    await contract.set_status(
      {
        message: newStatus,
        account_id: currentUser.accountId
      },
      BOATLOAD_OF_GAS
    );

    const status = await contract.get_status({
      account_id: currentUser.accountId
    });

    setStatus(status);
    fieldset.disabled = false;
  };

  const signIn = () => {
    wallet.requestSignIn(
      nearConfig.contractName,
      "NEAR Status Message"
    );
  };

  const signOut = () => {
    wallet.signOut();
    window.location.replace(window.location.origin + window.location.pathname);
  };

  return (
    <main>
      <header>
        <h1>NEAR Status Message</h1>

        {currentUser ?
          <p>Currently signed in as: <code>{currentUser.accountId}</code></p>
        :
          <p>Update or add a status message! Please login to continue.</p>
        }

        { currentUser
          ? <button onClick={signOut}>Log out</button>
          : <button onClick={signIn}>Log in</button>
        }
      </header>

      {currentUser &&
        <Form
          onSubmit={onSubmit}
        />
      }

      {status?
        <>
          <p>Your current status:</p>
          <p>
            <code>
              {status}
            </code>
          </p>
        </>
      :
        <p>No status message yet!</p>
      }
    </main>
  );
};

App.propTypes = {
  contract: PropTypes.shape({
    set_status: PropTypes.func.isRequired,
    get_status: PropTypes.func.isRequired
  }).isRequired,
  currentUser: PropTypes.shape({
    accountId: PropTypes.string.isRequired,
    balance: PropTypes.string.isRequired
  }),
  nearConfig: PropTypes.shape({
    contractName: PropTypes.string.isRequired
  }).isRequired,
  wallet: PropTypes.shape({
    requestSignIn: PropTypes.func.isRequired,
    signOut: PropTypes.func.isRequired
  }).isRequired
};

export default App;
