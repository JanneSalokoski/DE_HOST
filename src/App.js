import React from 'react';
import { nanoid } from 'nanoid';

import './App.css';

const config = {
	//url: 'ws://thawing-sands-14294.herokuapp.com/',
	url: 'ws://localhost:8000/',
	version: '1.0.0'
};


const StatusLine = (props) => {
	return (
		<div className='StatusLine'>
			<div>
				<div className={`StatusItem Connected ${props.connected ? 'online' : 'offline'}`} id='connected'>
					{props.connected ? 'online' : 'offline'}
				</div>
				<div className={`StatusItem ConnectionID ${props.connected ? 'enabled' : 'disabled'}`}>
					{props.connectionID}
				</div>
				<div className='StatusItem ServerAddress'>
					{config.url}
				</div>
			</div>
		</div>
	);
}

const CandidateView = (props) => {
	const [newCandidateName, setNewCandidateName] = React.useState('');
	const [newCandidateList, setNewCandidateList] = React.useState('');

	function generateCandidateItems(candidates) {
		if (candidates.length > 0) {
			console.log(candidates);
			return candidates.map(candidate => (
				<li id={candidate.id} key={candidate.id}>
					<span className='CandidateName'>{candidate.name}</span>
					<span className='CandidateList'>
						{candidate.list !== candidate.name ? ` [${candidate.list}]` : ``}
					</span>
					<span className='CandidateID'>{candidate.id}</span>
				</li>
			));
		}

		return <span className='InfoText'>
			Ehdokaslista on tyhjä. Voit lisätä ehdokkaita tämän laatikon alapuolelta!
		</span>
	}

	return (
		<div className='CandidateView'>
			<h2>Ehdokkaat</h2>
			<div className='CandidateList'>
				<ol start='2'>
					{generateCandidateItems(props.candidates)}
				</ol>
			</div>
			<div className={`NewCandidate ${props.electionStatus ? 'disabled' : 'enabled'}`}>
				<h3 className='FormTitle'>Lisää uusi ehdokas</h3>
				<label>Ehdokkaan tiedot: </label>
				<input type='text'
					value={newCandidateName}
					placeHolder='Ehdokkaan nimi'
					onChange={(event) => setNewCandidateName(event.target.value)}
				/>
				<input type='text'
					value={newCandidateList}
					placeHolder='Vaalilista'
					onChange={(event) => setNewCandidateList(event.target.value)}
				/>
				<input type='button'
					value='Lisää'
					onClick={(event) => {
						props.submitHandler({
							name: newCandidateName,
							list: newCandidateList
						});

						setNewCandidateName('');
					}}
				/>
			</div>
		</div>
	);
}

const VoterView = (props) => {
	function generateVoterItems(voters, verified) {
		if (voters.length > 0) {
			return voters.map(voter => (
				<li>
					<span className='VoterName'>{voter.name}</span>
					<span className='VoterID'>{voter.id}</span>
					<input type='button' className={verified ? 'RemoveButton' : 'AcceptButton'}
						value={verified ? 'Poista' : 'Hyväksy'}
						onClick={(event) => {
							(verified ? props.removeHandler : props.addHandler)(voter);
						}}
					/>
				</li>
			));
		}

		return <span className='InfoText'>
			{verified ? 'Lista on tyhjä. Et ole hyväksynyt yhtään äänestäjää.' : 'Lista on tyhjä. Kukaan ei ole rekisteröitynyt äänestäjäksi, tai olet hyväksynyt kaikki äänestäjät.'}
		</span>
	}

	return props.disabled ? (
		<div className='VoterView'>
			<h2>Äänestäjät</h2>
			<div>
				<h3>Varmistamattomat äänestäjät</h3>	
				<div className='VoterList unverified'>
					<ul>
						{generateVoterItems(props.unverifiedVoters, false)}
					</ul>
				</div>
			</div>
			<div>
				<h3>Varmistetut äänestäjät</h3>
				<div className='VoterList verified'>
					<ul>
						{generateVoterItems(props.verifiedVoters, true)}	
					</ul>
				</div>
			</div>
		</div>
	): '';
}

const ElectionControls = (props) => {
	return (
		<div className='ElectionControls'>
			<h2>Vaalin hallinta</h2>
			<input type='button'
				className={`StartButton ${props.electionStatus ? 'disabled' : 'enabled'}`}
				value='Käynnistä vaali'
				onClick={props.startElectionHandler}
			/>
			<input type='button'
				className={`EndButton ${!props.electionStatus ? 'disabled' : 'enabled'}`}
				value='Päätä vaali'
				onClick={props.stopElectionHandler}
			/>
			<div className={`ElectionStatistics ${props.electionStatus ? 'enabled' : 'disabled'}`}>
				<h3>Vaalin tila</h3>
				<p>Varmistettuja äänestäjiä: {props.voterCount}</p>
				<p>Ääniä annettu: {props.voteCount}</p>
			</div>
		</div>
	);
}

const ElectionResults = (props) => {
	function getResultRows(votes, candidates) {
		if (votes.length > 0) {
			return candidates.map(candidate => ({
				...candidate,
				votes: votes.filter(vote =>
					vote.candidate_id === candidate.id).length
			})).sort((a, b) => {
				if (a.votes > b.votes) {return -1}
				else if (a.votes < b.votes) {return 1}
				return 0;
			}).map(candidate => (
				<tr>
					<td><span className='CandidateID'>{candidate.id}</span></td>
					<td>{candidate.name}</td>
					<td>{candidate.list}</td>
					<td>{candidate.votes}</td>
					<td>{candidate.compare_number.toFixed(3)}</td>
				</tr>
			));
		}

		return <tr><td></td><td></td><td></td></tr>;
	}

	function getVoteRows(votes) {
		console.log("Votes: ", votes)
		return votes.map(vote => {
			const candidate = props.candidates.filter(candidate => candidate.id === vote.candidate_id)[0];
			return (
				<tr>
					<td><span className='VoteID'>{vote.vote_id}</span></td>
					<td>{`${candidate?.name}`}</td>
					<td>{candidate.list}</td>
					<td><span className='CandidateID'>{vote.candidate_id}</span></td>
				</tr>
			);
		});
	}

	return props.disabled && props.votes.length > 0 ? (
		<div className='ElectionResults'>
			<h2>Vaalin tulokset</h2>
			<h3>Vaalitulos</h3>
			<table>
				<thead>
					<tr>
						<th>Ehdokkaan tunniste</th>
						<th>Ehdokkaan nimi</th>
						<th>Vaalilista</th>
						<th>Äänimäärä</th>
						<th>Vertausluku</th>
					</tr>
				</thead>
				<tbody>
					{getResultRows(props.votes, props.candidates)}
				</tbody>
			</table>

			<h3>Annetut äänet</h3>
			<table>
				<thead>
					<tr>
						<th>Äänen tunniste</th>
						<th>Ehdokkaan nimi</th>
						<th>Vaalilista</th>
						<th>Ehdokkaan tunniste</th>
					</tr>
				</thead>
				<tbody>
					{getVoteRows(props.votes)}
				</tbody>
			</table>
		</div>
	): '';
}


export default () => {
	const [connectionID, setConnectionID] = React.useState('');
	const [connected, setConnected] = React.useState(false);
	const [electionStatus, setElectionStatus] = React.useState(false);
	
	const [candidates, setCandidates] = React.useState([]);

	const [unverifiedVoters, setUnverifiedVoters] = React.useState([]);
	const [verifiedVoters, setVerifiedVoters] = React.useState([]);

	const [voteCount, setVoteCount] = React.useState(0);

	const [electionResults, setElectionResults] = React.useState({
		votes: [], candidates: []
	});

	const action_handlers = {
		accept_connection: (payload) => {
			setConnected(payload.connected);
			setConnectionID(payload.connection_id);
		},
		accept_registration: (payload) => {
			setRegistered(payload);
		},
		voter_registration: (payload) => {
			let voters = [...unverifiedVoters];
			voters.push({id: payload.id, name: payload.name});
			setUnverifiedVoters(voters);
		},
		update_voters: (payload) => {
			setUnverifiedVoters(payload.unverified_voters);
			setVerifiedVoters(payload.verified_voters);
		},
		update_candidates: (payload) => {
			setCandidates(payload.candidates);
		},
		update_vote_count: (payload) => {
			setVoteCount(payload.vote_count);
		},
		update_election_status: (payload) => {
			setElectionStatus(payload.election_status);
		},
		update_election_results: (payload) => {
			setElectionResults(payload.election_results);
		}
	};

	const socket = new WebSocket(config.url);

	React.useEffect(() => {
		socket.addEventListener('open', (event) => {
			socket.send(JSON.stringify({
				type: 'connect',
				payload: { connection_type: 'host' }
			}));
		});

		socket.addEventListener('message', (event) => {
			const action = JSON.parse(event.data);
			console.log('Action: ', action);
			action_handlers[action.type](action.payload);
		});
	}, []);

	function newCandidateHandler(candidate) {
		socket.send(JSON.stringify({
			connection: connectionID,
			type: 'register_candidate',
			payload: {
				name: candidate.name,
				list: candidate.list
			}
		}));
	}

	function addVoterHandler(voter) {
		socket.send(JSON.stringify({
			connection: connectionID,
			type: 'verify_voter',
			payload: {
				id: voter.id,
				name: voter.name
			}
		}));
	}

	function removeVoterHandler(voter) {
		socket.send(JSON.stringify({
			connection: connectionID,
			type: 'unverify_voter',
			payload: {
				id: voter.id,
				name: voter.name
			}

		}));
	}

	function startElectionHandler() {
		socket.send(JSON.stringify({
			connection: connectionID,
			type: 'start_election'
		}));
	}

	function stopElectionHandler() {
		socket.send(JSON.stringify({
			connection: connectionID,
			type: 'end_election'
		}));
	}

	return (
		<div className='App'>
			<h1 className='title'>DE_HOST [{config.version}]</h1>
			<StatusLine
				connected={connected}
				connectionID={connectionID}
				electionStatus={electionStatus}
				voteCount={voteCount}
			/>
			<CandidateView
				candidates={candidates}
				submitHandler={newCandidateHandler}
				electionStatus={electionStatus}
			/>
			<VoterView disabled={!electionStatus}
				unverifiedVoters={unverifiedVoters}
				verifiedVoters={verifiedVoters}

				removeHandler={removeVoterHandler}
				addHandler={addVoterHandler}
			/>
			<ElectionControls
				voteCount={voteCount}
				voterCount={verifiedVoters.length}
				electionStatus={electionStatus}
				startElectionHandler={startElectionHandler}
				stopElectionHandler={stopElectionHandler}
			/>
			<ElectionResults disabled={!electionStatus}
				votes={electionResults.votes}
				candidates={electionResults.candidates}
			/>
		</div>
	);
}