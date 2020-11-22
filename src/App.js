import React from 'react';
import { nanoid } from 'nanoid';

import './App.css';

const config = {
	url: 'ws://localhost:3000',
	hostID: nanoid(10),
};


const StatusLine = (props) => {
	return (
		<div className='StatusLine'>
			<h2>Status</h2>
			<div className={`StatusItem Connected ${props.connected}`} id='connected'>
				Connected: {props.connected ? 'yes' : 'no'}
			</div>
			<div className='StatusItem ConnectionID'>
				ConnectionID: {props.connectionID}
			</div>
			<div className={`StatusItem Election ${props.electionStatus}`} id='electionStatus'>
				Election: {props.electionStatus}
			</div>
			<div className={`StatusItem VoteCount`} id='voteCount'>
				Votes: {props.voteCount}
			</div>
		</div>
	);
}

const CandidateView = (props) => {
	const [newCandidateName, setNewCandidateName] = React.useState('');
	
	function generateCandidateItems(candidates) {
		return candidates.map(candidate => (
			<li id={candidate.id} key={candidate.id}>{`${candidate.id}: ${candidate.name}`}</li>
		));
	}

	return (
		<div className='CandidateView'>
			<h2>Candidates</h2>
			<div className='CandidateList'>
				<ol>
					{generateCandidateItems(props.candidates)}
				</ol>
			</div>
			<div className='NewCandidate'>
				<label>Name: </label>
				<input type='text'
					value={newCandidateName}
					onChange={(event) => setNewCandidateName(event.target.value)}
				/>
				<input type='button'
					value='Submit!'
					onClick={(event) => {
						props.submitHandler(newCandidateName);
						setNewCandidateName('');
					}}
				/>
			</div>
		</div>
	);
}

const VoterView = (props) => {
	function generateVoterItems(voters, verified) {
		return voters.map(voter => (
			<li>
				<span>{voter.id}: </span>
				<span>{voter.name}</span>
				<input type='button' 
					value={verified ? 'Remove' : 'Accept'}
					onClick={(event) => {
						(verified ? props.removeHandler : props.addHandler)(voter);
					}}
				/>
			</li>
		));
	}

	return (
		<div className='VoterView'>
			<div className='unverified'>
				<h2>Unverified voters</h2>
				<ul>
					{generateVoterItems(props.unverifiedVoters, false)}
				</ul>
			</div>
			<div className='verified'>
				<h2>Verified voters</h2>
				<ul>
					{generateVoterItems(props.verifiedVoters, true)}	
				</ul>
			</div>
		</div>
	);
}

const ElectionControls = (props) => {
	function generateElectionControls(electionStatus) {
		if (!electionStatus) {
			return (
				<input type='button'
					value='Start election'
					onClick={props.startElectionHandler}
				/>
			);
		}

		return (
			<input type='button'
				value='Stop election'
				onClick={props.stopElectionHandler}
			/>
		);
	}

	return (
		<div className='ElectionControls'>
			<h2>Election controls</h2>
			{generateElectionControls(props.electionStatus)}
		</div>
	);
}

const ElectionResults = (props) => {
	function getResultRows(votes, candidates) {
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
				<td>{candidate.id}</td>
				<td>{candidate.name}</td>
				<td>{candidate.votes}</td>
			</tr>
		));
	}

	function getVoteRows(votes) {
		console.log("Votes: ", votes)
		return votes.map(vote => (
			<tr>
				<td>{vote.vote_id}</td>
				<td>{props.candidates.filter(candidate => candidate.id === vote.candidate_id)[0]?.name}</td>
				<td>{vote.candidate_id}</td>
			</tr>
		));
	}

	return (
		<div className='ElectionResults'>
			<h2>Election results</h2>
			<p>Votes given: {props.votes.length}</p>
			<h3>Results</h3>
			<table>
				<thead>
					<tr>
						<th>Candidate ID</th>
						<th>Candidate name</th>
						<th>Vote amount</th>
					</tr>
				</thead>
				<tbody>
					{getResultRows(props.votes, props.candidates)}
				</tbody>
			</table>

			<h3>Given votes</h3>
			<table>
				<thead>
					<tr>
						<th>Vote ID</th>
						<th>Candidate</th>
						<th>Candidate ID</th>
					</tr>
				</thead>
				<tbody>
					{getVoteRows(props.votes)}
				</tbody>
			</table>
		</div>
	);
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
		votes: []
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

	function newCandidateHandler(name) {
		socket.send(JSON.stringify({
			connection: connectionID,
			type: 'register_candidate',
			payload: { name: name }
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
			<StatusLine
				connected={connected}
				connectionID={connectionID}
				electionStatus={electionStatus}
				voteCount={voteCount}
			/>
			<CandidateView
				candidates={candidates}
				submitHandler={newCandidateHandler}
			/>
			<VoterView
				unverifiedVoters={unverifiedVoters}
				verifiedVoters={verifiedVoters}

				removeHandler={removeVoterHandler}
				addHandler={addVoterHandler}
			/>
			<ElectionControls
				electionStatus={electionStatus}
				startElectionHandler={startElectionHandler}
				stopElectionHandler={stopElectionHandler}
			/>
			<ElectionResults
				votes={electionResults.votes}
				candidates={candidates}
			/>
		</div>
	);
}