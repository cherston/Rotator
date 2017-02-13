import React, {Component, PropTypes} from 'react';
import Store from '../Store';
import Actions from '../Actions';
import NewLineChart from './NewLineChart';
import { DragSource } from 'react-dnd';
import { DragTypes } from '../DragConstants';
import Synth1 from './Synth';
import {Grid, Row, Col,Button,ButtonToolbar} from 'react-bootstrap';


/*
const ItemSource = {

	beginDrag(props){
		return {stream:props.stream, location:props.location, ID:props.location};
	},

	endDrag(props,monitor,component){
		const item = monitor.getItem();
		if(!monitor.didDrop()) {
			return;
		}

		const dropResult = monitor.getDropResult();


		if(item.stream.get('SwipeState')==='v')
		{
			if(dropResult.zone !== 'viz')
			{
				Actions.swipe(item.location);
				Actions.occupy(item.location,dropResult.zone);
			}

		}
		else
		{
			const prev_zone = item.stream.get('audID');
			Actions.occupy(null,prev_zone);
			if(dropResult.zone === 'viz')
				Actions.swipe(item.location);
			else
				Actions.occupy(item.location,dropResult.zone);
		}

	},

	isDragging(props,monitor){
		return props.ID === monitor.getItem().ID
	}

};

function collect(connect, monitor){
	return {
		connectDragSource: connect.dragSource(),
		isDragging: monitor.isDragging(),
		connectDragPreview: (connect.dragPreview()),
		initialClientOffset: monitor.getInitialClientOffset(),
		didDrop: monitor.didDrop(),
	}
};

*/
class Item extends Component {
	constructor(props) {
		super(props);
		this._onChange = this._onChange.bind(this);
		this.handleSwipe = this.handleSwipe.bind(this);
		this.handleRemove = this.handleRemove.bind(this);

		this.state = {
			StreamID_index: this.props.location,
			Latest: null,

		}
	};


	shouldComponentUpdate(nextProps, nextState){
		//console.log('should item update? ' + nextProps.slidestate + ',' + this.props.slidestate);
		//return true;

		var result = nextProps.stream.get('SwipeState') !== this.props.stream.get('SwipeState')
			|| nextProps.slidestate !== this.props.slidestate || nextProps.shift !== this.props.shift
			|| nextProps.header !== this.props.header || nextProps.stream.get('fft') !== this.props.stream.get('fft')
			|| nextProps.stream.get('pearson') !== this.props.stream.get('pearson')
			|| nextProps.beatnum !== this.props.beatnum
			|| nextProps.spb != this.props.spb;


		return result;
		/*
				key={i}
 				ID={stream.get('ID')}
 				stream={stream}
 				location={this.props.findPlotIndex(stream.get('ID'))}
 				type={stream.get('SwipeState')}
 				shift={this.props.shift}
 				slidestate={this.props.slidestate}
 				header={stream.get('header')}
 		*/

	};



	componentDidMount(){
		Store.addSlideListener(this._onChange);

	};
	componentWillUnmount(){
		Store.removeSlideListener(this._onChange);
	};
	handleSwipe(){
		//console.log('swiping location: ' + this.props.location);
		Actions.swipe(this.props.location);
	};
	handleZoom(delta){
		Actions.zoom(this.props.location,delta)
	};
	handleRemove(){
		Actions.remove(this.props.location);
	};

	getLatest(){
		//console.log('in getLatest()');
		return this.props.stream.get('Data').get(this.props.slidestate + Store.getShift() - 1);
	};

	handleFFT(){
 		console.log('starting fft...')

		//console.log(JSON.stringify(spec_points));
		//spectrum = spectrum.map((d) => d);
		Actions.setFFT(this.props.location)
 		//console.log('spectrum: ' + spectrum);
 	}

	_onChange(props){
		//console.log('slidestate in item: ' + this.props.slidestate);
		this.setState({
				StreamID_index: this.props.location,
				Latest: this.getLatest(),
				Shift: Store.getShift()
		});
	};



	render(){
		console.log('item header: ' + this.props.header);
		//console.log('renewing Item');
		/*
		var connectDragSource = this.props.connectDragSource;
		var connectDragPreview = this.props.connectDragPreview;
		var isDragging = this.props.isDragging;
		var didDrop = this.props.didDrop;
		var itemstyle;
		*/

		//console.log('swipestate of current stream: ' + this.props.stream.get('SwipeState'));
		//console.log('rerendering item with latest = ' + this.state.Latest);
		//console.log(this.props.stream.get('ID') + ": " + this.props.stream.get('SwipeState'));
		/*

		if(isDragging)
			return null;
		*/

		console.log('plot_mode: ' + this.props.stream.get('plot_mode'));
		//console.log('stream data in item: ' + this.props.stream.get('Data'));
		//this.props.stream.get('Data')
		const coef = this.props.stream.get('pearson');
		const header = coef ? <span>[Pearson Correlation]: </span> : null;
		const pearson = coef ? coef.map((corel) => <span><b>{corel.get('correlation').toFixed(3)}</b> ({corel.get('a')}+{corel.get('b')}) </span>) : null;

		//console.log('beatnum in item: ' + this.props.beatnum);
		if(this.props.stream.get('SwipeState') === 'v' || this.props.stream.get('SwipeState') === 'av')
		{
			//this.props.stream.get('fft') ? console.log('fft in item: ' + JSON.stringify(this.props.stream.get('fft'))) : console.log('no FFT');

			//console.log('here ');
			return (
			<div style={{backgroundColor: 'AliceBlue', borderRadius: 0}}>
				<h3> Data Stream:  {this.props.header} </h3>


				<NewLineChart
					ref={'NewLineChart'}
					height={200}
					fft={this.props.stream.get('fft')}
					all_data={this.props.stream.get('Data').toJS()}
					shift={Store.getShift()}
					position={this.props.slidestate}
					beatnum={this.props.beatnum}
					spb={this.props.spb.spb}
					numViz={this.props.numViz}
					synth={this.props.synth}
					plot_mode={this.props.stream.get('plot_mode')}
					/>


    				{/*{this.props.stream.get('Data').slice(Store.getSlideState(),Store.getSlideState()+Store.getShift())} */}
    			<div style={{paddingLeft:25}}>
    			<div>
				{header}{pearson}
				</div>
				<input type="checkbox" name="FFT" value="true" onClick={this.handleFFT.bind(this)} /> <b> FFT </b>
				<Button bsSize="small" onClick={this.handleRemove}>Remove</Button>
				</div>

			</div>
		)
		}

		else
		{
			//console.log('here: latest in item: ' + this.state.Latest);
			const latest = didDrop ? null : this.state.Latest;
			return(
				<div>
				{<h4 key={this.props.stream.get('ID')}>Stream #{this.props.stream.get('ID')}</h4>}
				<input type="checkbox" name="FFT" value="true" onClick={this.handleFFT.bind(this)} /> <b> FFT </b>

				</div>
			)
			/*
			var circle = {
			    width: 100,
			    height: 100,
			    borderRadius: 100/2,
			    backgroundColor: '#f08080',



			}

			var item = {
				paddingTop:25,
				paddingLeft:25,
			}

			const latest = didDrop ? null : this.state.Latest;

			return connectDragPreview(connectDragSource(

			<div style={item}>
			<Synth1 latest={latest}/>

			<div style={circle}></div>
						<div style={{position:'relative', top:-75,left:5}}> <h4>Stream #{this.props.stream.get('ID')}</h4></div>
						<div style={{position: 'relative', left:-10, top:-50}}>
						<Grid><Row>
						<Col><ButtonToolbar>
					      <Button bsSize="small" onClick={this.handleSwipe}>Swipe</Button>
					      <Button bsSize="small" onClick={this.handleRemove}>Remove</Button>
					     </ButtonToolbar></Col>
					    </Row></Grid>
					    </div>
			</div>
			))
			*/

		}
	}
};

//export default DragSource(DragTypes.ITEM, ItemSource, collect)(Item);
export default Item;