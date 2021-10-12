import * as React from 'react';
import PropTypes from 'prop-types';
import './Aims.scss';

class Connection {
}

class Aim {
  public title: String
  public owner: String
}

type AimsState = (
  ({[aim_id: string]: Aim})
)

type ConnectionState = (
  {[contributor_id: string]: {[beneficiary_id: string]: Connection}}
)

export default function Aims({ contract, currentUser }) {

  const fieldset = React.createRef<HTMLFieldSetElement>();
  const [aims, setAims] = React.useState<AimsState>({})
  const [connections, setConnections] = React.useState<ConnectionState>({})

  const [nextAimId, setNextAimId] = React.useState(0)

  React.useEffect(() => {
    let aimIds = []
    // initialize - as we don't have an indexer yet, just load aims with id 1,2,...,n until there are no more. 
    const loadAims = async () => {
      let loop = true
      for(let i = 0; loop; i++) {
        const id = String(i)
        console.log("trying to load aim with id", id)
        const aim = await contract.get_aim({id})
        if (aim.Ok !== undefined) {
          aimIds.push(id)
          setAims(prev => ({...prev, [id]: aim.Ok}))
        } else {
          loop = false
          setNextAimId(i)
        }
      }
    }

    // then try to load all connections between those aims
    const loadConnections = async () => {
      console.log("aim ids:", aimIds)
      aimIds.forEach(contributor_id => {
        aimIds.forEach(async beneficiary_id => {
          console.log("trying to load connection", contributor_id, "-->", beneficiary_id)
          const result = await contract.get_connection({contributor_id, beneficiary_id})
          console.log("result", result) 
          if (result.Ok !== undefined) {
            setConnections(prev => ({
              ...prev, 
              [contributor_id]: {
                ...prev[contributor_id], 
                [beneficiary_id]: result.Ok
              }
            }))
          }
        })
      })
    }

    loadAims().then(
      () => { loadConnections() }
    )
  }, [])

  const [newAimTitle, setNewAimTitle] = React.useState<string>(""); 
  const updateNewAimTitle = (event: React.ChangeEvent<HTMLInputElement>) => {
    setNewAimTitle(event.target.value)
  }

  const createAim = async (e: React.FormEvent<HTMLFormElement>) => {
    console.log("creating aim!")
    e.preventDefault()
    const id = String(nextAimId)
    console.log(id) 
    await contract.add_aim({
      title: newAimTitle, 
      id
    });
    setNextAimId(nextAimId + 1)
    setAims(prev => ({
      ...prev, 
      [id]: {
        title: newAimTitle, 
        owner: currentUser.accountId
      }
    }))
    setNewAimTitle("")
  }

  const [ccc, setCcc] = React.useState<string | undefined>(undefined); 

  const startConnectAim = (id: string) => {
    setCcc(id)
  } 

  const completeConnectAim = async (id: string) => {
    console.log("creating connection from", ccc, "to", id)
    const contributor_id = ccc
    const beneficiary_id = id
    console.log(await contract.connect_aim({contributor_id, beneficiary_id}))
    setConnections(prev => ({
      ...prev, 
      [ccc]: {
        ...prev[ccc], 
        [id]: {}
      }
    }))
    setCcc(undefined)
  } 

  return (
    <>
      <form onSubmit={createAim}>
        <fieldset ref={fieldset}>
          <p>Add an aim!</p>
          <p className="highlight">
            <label htmlFor="title">Title:</label>
            <input
              autoComplete="off"
              autoFocus
              required
              name="title"
              value={newAimTitle}
              onChange={updateNewAimTitle}
            />
          </p>
          <button type="submit">
            create aim
          </button>
        </fieldset>
      </form>

      <h2> aims </h2>
      { 
        Object.keys(aims).map(id => {
          const aim = aims[id]
          return (
            <div className="aim" key={id}>
              <div className="info">
                id: {id}<br/>
                title: {aim.title}<br/>
                owner: {aim.owner}
              </div>
              { ccc === undefined ?
                <div className="connect from" onClick={() => startConnectAim(id)}>
                  contribute from 
                </div>
                :
                <div className="connect to" onClick={() => completeConnectAim(id)}>
                  contribute to
                </div>
              }
            </div>
          )
        })
      }
      <h2> connections </h2>
      { 
        Object.keys(connections).map(contributor_id => {
          return Object.keys(connections[contributor_id]).map(beneficiary_id => (
            <div className="connection" key={contributor_id + '-' + beneficiary_id}>
              { contributor_id } {'-->'} { beneficiary_id }
            </div>
          ))
        }).flat()
      }
    </>
  );
}

Aims.propTypes = {
  contract: PropTypes.shape({
    add_aim: PropTypes.func.isRequired, 
    get_aim: PropTypes.func.isRequired, 
    connect_aim: PropTypes.func.isRequired, 
    get_connection: PropTypes.func.isRequired, 
  }).isRequired,
  currentUser: PropTypes.shape({
    accountId: PropTypes.string.isRequired,
    balance: PropTypes.string.isRequired
  })
};
