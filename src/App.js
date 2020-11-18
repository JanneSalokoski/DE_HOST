import React from 'react';

// TODO: Extract into it's own file
const config = {
	base_url: 'http://localhost:3000'
};

// TODO: Extract into it's own file
function sendGetRequest(endpoint, callback) {
	fetch(`${config.base_url}/${endpoint}`, {
		method: 'GET',
		headers: {'Content-Type': 'application/json'}
	})
		.then(response => response.json())
		.then(data => { callback(data) });
}

function sendPostRequest(endpoint, body, callback) {
	fetch(`${config.base_url}/${endpoint}`, {
		method: 'POST',
		headers: {'Content-Type': 'application/json'},
		body: JSON.stringify(body)
	})
		.then(response => response.json())
		.then(data => { callback(data) });
}

// TODO: Extract into it's own file
const API = {
	getElectionStatus: (callback) => {
		sendGetRequest('election_status', callback);
	},

	setElectionStatus: (value, callback) => {
		sendPostRequest('election_status', {'election_status': value}, callback);
	}
};


// TODO: Extract into it's own file
const ElectionStatus = (props) => {
	return (
		<div className="ElectionStatus">
			<h3>Election: {props.electionStatus}</h3>
			<input type="button" 
				value="Start election"
				onClick={props.startElectionClickHandler}
			/>
			<input type="button" 
				value="End election"
				onClick={props.endElectionClickHandler}
			/>
		</div>
	);
}

const VoterVerification = (props) => {
	return (
		<div className="VoterVerification">
			<h3>Verify voters</h3>
			<input type="button"
				value="Refresh voters"
			/>
		</div>
	);
}


export default () => {
	const [electionStatus, setElectionStatus] = React.useState('not running');
		
	React.useEffect(() => {
		API.getElectionStatus((response) => {
			setElectionStatus(response.election_status);
		});
	}, []);


	function handleStartElectionClick(event) {
		API.setElectionStatus('running', (response) => {
			setElectionStatus(response.election_status);
		});
	}

	function handleEndElectionClick(event) {
		API.setElectionStatus('not running', (response) => {
			setElectionStatus(response.election_status);
		});
	}

	return (
		<div className="App">
			<p>DS_HOST 0.0.0</p>
			<ElectionStatus
				electionStatus={electionStatus}
				startElectionClickHandler={handleStartElectionClick}
				endElectionClickHandler={handleEndElectionClick}
			/>
			<VoterVerification

			/>
		</div>
	);
};