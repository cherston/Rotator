import React, {Component, PropTypes} from 'react';
import Store from '../Store';
import Actions from '../Actions';
import {Grid, Row, Col,Button,ButtonToolbar} from 'react-bootstrap';


class ClusterText extends Component {
	constructor(props) {
		super(props);
		this.handleRemove = this.handleRemove.bind(this);


	};

	handleRemove(i){
		//console.log('removing val: ' + (i));
		Actions.removeCluster(i);
	};



	render(){
		return(
			<div>
				{Store.getClustNum().map(function(cluster, i){
					//console.log('cluster list: ' + cluster.contents);
					return(<div key={i}>
					{i < Store.getClustNum().length - 1 ?
						<Button bsSize="xsmall" onClick={this.handleRemove.bind(this,cluster.val)}>Remove</Button>
						: <b>New Cluster </b>}
					<span><b>  {cluster.val}: </b></span>{cluster.contents.map((i => <span key={i}>{Store.getStream(i).get('header')} </span>))}


					</div>)}.bind(this))
				}
			</div>
			)


	}
};

export default ClusterText;
//export default Item;