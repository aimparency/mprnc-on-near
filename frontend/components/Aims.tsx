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
  const [initializing, setInitializing] = React.useState(true)

  React.useEffect(() => {
    // initialize - as we don't have an indexer yet, just load aims with id 1,2,...,n until there are no more. 
    const loadAims = async () => {
      let loop = true
      for(let i = 0; loop; i++) {
        const id = String(i)
        console.log("trying to load aim with id", id)
        const aim = await contract.get_aim({id})
        if (aim.Ok !== undefined) {
          setAims(prev => ({...prev, [id]: aim.Ok}))
        } else {
          loop = false
          setNextAimId(i)
        }
      }
    }

    // then try to load all connections between those aims
    const loadConnections = async () => {
      const aim_ids = Object.keys(aims)
      aim_ids.forEach(contributor_id => {
        aim_ids.forEach(async beneficiary_id => {
          const result = await contract.get_connection({contributor_id, beneficiary_id})
          if (result.Ok !== undefined) {
            setConnections(prev => ({
              ...prev, 
              [result.contributor_id]: {
                ...prev[result.contributor_id], 
                [result.beneficiary_id]: result.Ok
              }
            }))
          }
        })
      })
      setInitializing(false)
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
              id: {id}<br/>
              title: {aim.title}<br/>
              owner: {aim.owner}
            </div>
          )
        })
      }
      <h2> connections </h2>
      { 
        Object.keys(connections).map(contributor_id => {
          Object.keys(connections).map(beneficiary_id => {
            return (
              <div className="connection">
                { contributor_id } {'-->'} { beneficiary_id }
              </div>
            )
          })
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
