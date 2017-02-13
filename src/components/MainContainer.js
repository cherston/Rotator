import React, {Component, PropTypes} from 'react';
import AudCluster from './AudCluster';
import Store from '../Store';
import Actions from '../Actions';
import { DragDropContext } from 'react-dnd';
import HTML5Backend from 'react-dnd-html5-backend';
import UploadZone from 'react-dropzone';
import Synth1 from './Synth';
import Item from './Item';
import AudioItem from './AudioItem';
import ListViz from './ListViz';
import ClusterText from './ClusterText';
var Immutable = require('immutable');
const { PageHeader, SplitButton, MenuItem, FormGroup, Form, Radio, Grid, Row, Col, Button, ButtonToolbar, ButtonGroup, Well, Checkbox, DropdownButton} = require('react-bootstrap');
var Menu = require('react-burger-menu').slide;

class MainContainer extends Component{


	constructor(props) {
		super(props);
		this._onChange = this._onChange.bind(this);
		this.getMode = this.getMode.bind(this);
		this.handleFile = this.handleFile.bind(this);
		this.handleSuperposition = this.handleSuperposition.bind(this);
		this.handleSynth = this.handleSynth.bind(this);
		this.find_plot_Index = this.find_plot_Index.bind(this);
		this.handleNextSample = this.handleNextSample.bind(this);
		this.download_data = this.download_data.bind(this);
		this.handleResetTick = this.handleResetTick.bind(this);
		this.handleDataToggle = this.handleDataToggle.bind(this);
		this.handleCollapse = this.handleCollapse.bind(this);
		this.changeMode = this.changeMode.bind(this);
		this.onStressSelect = this.onStressSelect.bind(this);
		this.onActivitySelect = this.onActivitySelect.bind(this);

		this.tempo = Store.getTempo();
		this.state = {
			VizStreams: Store.getStreams('v'),
			AudStreams: Store.getStreams('a'),
			allStreams: Store.getStreams('all'),
			Play_set: false,
			Synth: AudCluster,
			spb: {spb: 60.0 / Store.getTempo(), beat:0},
			approxbeat:0,
			nextTime:null,
			activeTab: {synth:'WebAudioOsc',min:100,max:30000,default:150},
			UI:'bio',
			collapsed:false,
			viewing_mode: 'TUT',
			stress: null,
			activity: null,

		}
		this.nextTime = null;
		this.lastNoteTime = null;
		this.approxbeats = [];
		this.tick = 0;
	};

	changeMode(evt){
		console.log('classname: ' + evt.target.name);
		this.setState({viewing_mode:evt.target.name});
	}

	showSettings(event){
		event.preventDefault();
	};

	getMode(x,y){
		//console.log('getMode in maincontainer with: ' + x + ', ' + y);
 		return(this.refs.nodes.getMode(x,y));

	};

	handleSuperposition(CSVs,mode) {
		CSVs.forEach((csv) => {

			var fr = new FileReader();

			fr.onload = function(e) {
				var lines = e.target.result.split('\r');
				var sorted = Immutable.Map();
				lines.map(function(line){

					var values = line.split(',');
					console.log('exists? ' + sorted.get(values[1]))

					if(sorted.get(values[1]))
						sorted = sorted.update(values[1], d => d.push(values[0].toJS()))

					else
					{
						sorted = sorted.set(values[1],[values[0]])
					}

				})
				console.log(JSON.stringify(sorted));
				var value2 = lines.shift().split(',');
				console.log('test: ' + value2[0] + ' and ' + value2[1]);
			};
			fr.readAsText(csv);
		})
	}

  	handleFile(CSVs,mode) {
  		//console.log('uploading file...');
		CSVs.forEach((csv)=> {

		 	var fr = new FileReader();
		 	var getMode = this.getMode;

		fr.onload = function(e) {
			//console.log('test: ' + e.target.result.slice(0,3000));
			var lines = e.target.result.split('\r');
			var header = lines.shift();
			var coords = lines.shift().split(' ');
			var plot_mode = lines.shift();
			var values = lines.map((lin) => Number(Math.abs(lin)));
			console.log('header: ' + header);
			console.log('coords: ' + coords);
			var coords_map = {x:coords[0], y:coords[1]};
			console.log('plot_mode: ' + plot_mode);
			console.log('header: ' + header + ' coords: ' + JSON.stringify(coords_map));
			console.log('values: ' + values[4]);

			//FOR MY SMALL TEST FILES
			/*var lines = e.target.result.split('\n').map((line) => line.split(',').map(Number));
			var coords = lines[0];
			var coords_map = {x:coords[0], y:coords[1]};
			var values = lines[1];
			//console.log('lines: ' + lines);
			*/
			//console.log('in main container adding header: ' + header);
			//GOOD FOR SPACE DATA
			const data_sample = values.slice(0,12000);
			const data_all = values;

			Actions.addStream('stream',coords_map,data_sample,getMode(coords_map.x, coords_map.y),header, plot_mode, data_all);

		};




		fr.readAsText(csv);

		//console.log('refs: ' + JSON.stringify(this.refs));

		//console.log('refs: ' + this.refs.nodes);



	});

	};

	componentDidMount(){
		Store.addChangeListener(this._onChange);
		this.intervals = [];
		this.audioCtx = new window.AudioContext();
		const listener = this.audioCtx.listener;
		//this.testaudio();

	};
	componentWillUnmount(){
		Store.removeChangeListener(this._onChange);
		this.intervals.forEach(clearInterval);
		this.audioCtx.close();
	};
	setInterval(){
		this.intervals.push(setInterval.apply(null, arguments));
	}
	clearInterval(){
		this.intervals.forEach(clearInterval);
	}

	_onChange(){


		this.setState({
			VizStreams: Store.getStreams('v'),
	      	AudStreams: Store.getStreams('a'),
	      	allStreams: Store.getStreams('all'),
	      	spb: {spb: 60.0 / Store.getTempo(), beat:0},
		});
		/*
		if (Store.getAuto() === 'play' && !this.state.Play_set)
		{
			this.setInterval(
		      () => { Actions.slide(Store.getShift()-1); },
		      2000);
		    this.state.Play_set = true;
		}
		if(Store.getAuto() === 'pause')
		{
			this.clearInterval();
			this.state.Play_set = false;
		}
		*/
		if(Store.getStreams('a').size === 0){
			this.nextTime = null;
		}
		const center = Store.getCenter();
		this.scaled_coords = this.AMSInvScale(center[0],center[1]);
		//console.log('setting listener coords to: ' + this.scaled_coords.x + ' ' + this.scaled_coords.y);
		//this.audioCtx.listener.setPosition(scaled_coords.x,scaled_coords.y,300);

	};

	AMSScale(x,y){
		//console.log('scaling x value: ' + x + ' and y value: ' + y);
		return({
			x: x * 34.5 + 42,
			y: 344 - y * 33.8
		})
	}
	AMSInvScale(x,y){
		return({
			x: (x - 42) / 34.5,
			y: (344 - y) / 33.8
		})

	}
	handleSlide(step){
		console.log('in handle slide');
		Actions.slide(step);
	};

	handlePlay(){
		//this call to slide immediately triggers the synth. Meanwhile, settimeout in MainContainer handling the rest
		//Actions.slide(Store.getShift()-1);
		Actions.play();
	};
	handlePause(){
		Actions.pause()
	};

	find_plot_Index(id){
		const allStreams = Store.getStreams('all');
		return allStreams.findIndex(function(item){
			return (item.get('ID') === id)
		})
	};

	handleToggle(synth){
		this.state.Synth = synth;
	}
	handleExtend(step){
		console.log('handle extend');
		Actions.extend(step)
	}
	handleTempo(evt){
		console.log('TEMPO CHANGE.');

		if(evt)
		{
			console.log('value: ' + JSON.stringify(evt.target.value) + 'approxbeat is: ' + this.state.approxbeat);
			Actions.speed(evt.target.value)
		}
		else
			Actions.speed(this.min)
		this.setState({spb: {spb: 60.0 / Store.getTempo(), beat:this.state.approxbeat}})
		console.log('TEMPO spb state set to: ' + 60.0 / Store.getTempo())
	}
 	setbeatTime(approxbeat,inWindowSize,time){
 			//ISSUE: approxbeat relates to whats being scheduled, not what's playing. Need to sorta 'schedule' the animation
 			//but we need webaudioosc to make the queue
 			//if (Store.getAuto() === 'play' && this.state.approxbeat === inWindowSize)
 			//	Actions.slide(Store.getShift()-1);
 			/*
 			if(approxbeat === inWindowSize-1){
 				console.log('adjusting lastnotetime to: ' + time);
 				this.lastNoteTime = time
 			}

 			if(this.lastNoteTime !== null && Store.getAut. o() === 'play'){
 				if(Math.abs(this.audioCtx.currentTime - this.lastNoteTime) < 0.1){
 						console.log('subtraction: ' + (this.audioCtx.currentTime - this.lastNoteTime));
		     		 	Actions.slide(Store.getShift()-1);
		     		 	console.log('the last beat played at: ' + this.lastNoteTime + 'and animation playing at:' + this.audioCtx.currentTime);


 					this.lastNoteTime = null;
 				}
 			}

			*/

	 		var approx = (approxbeat + 3 >= inWindowSize) ? 0 : approxbeat + 3;

	 		if(approx !== this.state.approxbeat)
	 		{
	 			//console.log('original was: ' + approxbeat + ' and adjusting to ' + approx);
		 		console.log('in setbeat =) setting beat to: '  + (approx) + ' and time to: ' + this.nextTime + ' current time: ' + this.audioCtx.currentTime);
		 		this.setState({approxbeat:approx, nextTime:time})
		 		console.log('approxbeat: ' + approx);
		 		this.approxbeats.push({approxbeat:approx, nextTime:time});
		 	}

		 	//check if location lines in plots should update
		 	if(this.approxbeats[0])
		 	{
		 		console.log('this.approxbeats: ' + JSON.stringify(this.approxbeats));
		 		var dif = this.audioCtx.currentTime - this.approxbeats[0].nextTime;

		 		while(Math.abs(dif) < 60/Store.getTempo() * 2 || dif > 0.3)
		 		{
		 			console.log('dif: ' + dif + 'less than: ' + 60/Store.getTempo() * 4);
		 			if(this.approxbeats.length > 0)
		 			{
			 			var obj = this.approxbeats.pop();

			 			var delay = parseInt(Store.getTempo()/100) > 1 ? parseInt(Store.getTempo()/100) : -1;
			 			console.log('obj.approxbeat:' + obj.approxbeat + 'this.tick: ' + this.tick + 'delay: ' + delay + ' this.tick - delay: ' + (this.tick - delay) + ' inWindow Size: ' + inWindowSize);

			 			if(this.tick >= inWindowSize - 10){
			 				this.tick = 0;
			 			}
			 			if(obj.approxbeat > this.tick + delay || obj.approxbeat < delay * 4)
			 			{
				 			console.log('updating tick to: ' + JSON.stringify(obj) + 'length of remaining approxbeats is: ' + this.approxbeats.length + 'current time: ' + this.audioCtx.currentTime);
				 			this.tick = obj.approxbeat;
				 			//console.log('a');
				 		}
			 			if(this.approxbeats[0])
			 			{
			 				//console.log('b');
			 				dif = this.audioCtx.currentTime - this.approxbeats[0].nextTime;
			 			}
			 			else
			 			{
			 				//console.log('c');
			 				break;
			 			}
			 			//console.log('d');
		 			}
		 			//console.log('e');
		 		}
		 		//console.log('f');

		 	}
		 	//console.log('leaving setbeat');

 	}
 	setNextTime(time){
 		this.nextTime = time + 1 * this.state.spb.spb;
 	}

 	handleClick(cp){
 		console.log('toggling spatialize');
 		Actions.toggleSpatialize();
 	}

 	handleCluster(){

 		Actions.nextCluster();
 	}
 	handleSynth(e){
 		e.preventDefault();

 		this.setState({activeTab:this.state.activeTab.synth === 'DirectSynth' ?
 			{synth:'WebAudioOsc',min:100,max:3000,default:150}
 			: {synth:'DirectSynth',min:3800 * 60,max:27000 * 60,default:3800 * 60}});
 		this.min = this.state.activeTab.synth === 'DirectSynth' ? 100 : 3800 * 60;
 		this.handleTempo();
 	}
 	handleFF(evt){
 		console.log('in handleFF with type: ' + evt.target.className);
 		Actions.setFF(evt.target.value,evt.target.className);
 	}
 	handleModDepth(evt){
 		Actions.setModDepth(evt.target.value,evt.target.className);
 	}
 	handleMaxVal(evt){
 		Actions.setMaxVal(evt.target.value,evt.target.className);
 	}
 	handleMinVal(evt){
 		console.log('here');
 		Actions.setMinVal(evt.target.value, evt.target.className);
 	}
 	handleCollapse(){
 		this.setState({collapsed:!this.state.collapsed});
 	}
 	handleScatterFreq(evt){
 		Actions.setScatterFreq(evt.target.value, evt.target.className)
 	}
 	handleScatterGain(evt){
 		Actions.setScatterGain(evt.target.value,evt.target.className)
 	}
 	handleNextSample(){
 		console.log('handle next sample');
 		const type = Math.round(Math.random());
 		var val = Math.floor(Math.random() * 671205);

 		var plot_type = null;
 		if(type === 1)
 		{
 			plot_type = 'stressed';
 			val = val += 671205;
 		}
 		else
 			plot_type = 'calm';

 		var timestamp = Math.floor(Date.now() / 1000)

 		this.log_event(timestamp, this.state.viewing_mode, 'nextSample',plot_type,val,(val + 3000), this.state.stress, this.state.activity);


		//this.download_data();

		this.setState({stress:null, activity:null})

 		Actions.setSampleRange(val, val + 3000);

 	}
 	handleResetTick(){
 		this.tick = 0;
 		this.setState({approxbeat:0});
 	}
 	handleDataToggle(){
 		var UI;
 		if(this.state.UI === 'space')
 			UI = 'bio'
 		else if(this.state.UI === 'bio')
 			UI = 'shor'
 		else if(this.state.UI === 'shor')
 			UI = 'space'

 		this.setState({UI:UI})
 		Actions.remove(null,'all');

 	}
 	log_event(timestamp, mode, action,plot_type,plot_start,plot_end, stress, activity){

		var data2 =[timestamp, mode, action, plot_type, plot_start, plot_end, stress, activity];

		if(!localStorage['data'])
			localStorage['data'] = JSON.stringify([data2]);
		else{
			var retrieved = JSON.parse(localStorage['data']);
			retrieved.push(data2);
			localStorage['data'] = JSON.stringify(retrieved);
		}
	}
	download_data(){
		//console.log(localStorage['data']);

		var retrieved = JSON.parse(localStorage['data']);
		console.log('retrieved:' + retrieved);

		var csvContent = 'data:text/csv;charset=utf-8,';
		retrieved.forEach(function(infoArray, index){

		   var dataString = infoArray.join(',');
		   csvContent += index < retrieved.length ? dataString+ '\n' : dataString;

		});
		console.log(JSON.stringify(csvContent));

		var encodedUri = encodeURI(csvContent);
		window.open(encodedUri);
		localStorage.clear();

	}
	onStressSelect(evt){
		this.setState({stress:evt.target.value})
	}
	onActivitySelect(evt){
		this.setState({activity:evt.target.value})
	}
  	render(){
  		//console.log(this.state.AudStreams ? this.state.AudStreams.map((stream) => stream.get('ID')) : 'None!')
  		//console.log('renewing MainContainer. The slidestate is: ' + Store.getSlideState());
  		//console.log('spb beat: ' + this.state.spb.spb );
  		console.log('rerendering main');
  		if(this.state.AudStreams.size === 0)
  			this.approxbeats = [];

  		if(this.state.allStreams.size === 0)
  			this.tick = 0

  		var styles = { bmItemList: {
		    color: '#b8b7ad',
		    padding: '0.8em'
		  }};


    return (
		<div>

			<PageHeader>ROTATOR <small>Data Sonification For Maximizing Attentive Capacity </small></PageHeader>
			<Menu noOverlay width={350}>

				 <font color="white" size="5">Sonification Controls</font>
				 <font size="1">Tempo Control: <b>{Store.getTempo()} bpm</b></font>

				 <div>
				 <input
		            type="range"
		            min={this.state.activeTab.min}
	                max={this.state.activeTab.max}
	                defaultValue={this.state.activeTab.default}
	                onMouseUp={this.handleTempo.bind(this)}/>
	            </div>


	              {/* ________ */}


	            <font color="white" size="2"><b>Temperature (Beat Synth) </b></font>
	            <font size="1">Fundamental Frequency: <b>{Store.getFF('high')} hz</b></font>
	            <input className='high' style={{height:5, width:100}}
		            type="range"
		            min={0}
	                max={300}
	                defaultValue={Store.getFF('high')}
	                onMouseUp={this.handleFF.bind(this)}
	            />
	            <font size="1">Modulation Depth: <b>{Store.getModDepth('high')}%</b></font>
	            <input className='high' style={{width:100}}
		            type="range"
		            min={0}
	                max={50}
	                defaultValue={Store.getModDepth('high')}
	                onMouseUp={this.handleModDepth.bind(this)}
	            />
	            <font size="1">Max Data Val: <b>{Store.getMaxVal('high')}</b></font>
	            <input className='high' style={{width:100}}
		            type="range"
		            min={0}
	                max={10}
	                step={0.1}
	                defaultValue={Store.getMaxVal('high')}
	                onMouseUp={this.handleMaxVal.bind(this)}/>
	            <font size="1">Min Data Val: <b>{Store.getMinVal('high')}</b></font>
	            <input className='high' style={{width:100}}
		            type="range"
		            min={0}
	                max={10}
	                step={0.1}
	                defaultValue={Store.getMinVal('high')}
	                onMouseUp={this.handleMinVal.bind(this)}/>
	            <font size="1">Gain <b>{Store.getScatterGain('high')}</b></font>
	            <input className='high' style={{width:100}}
		            type="range"
		            min={0}
	                max={1}
	                step={0.05}
	                defaultValue={Store.getScatterGain('high')}
	                onMouseUp={this.handleScatterGain.bind(this)}/>


	                   {/* ________ */}


	            <font color="white" size="2"><b>Accelerometer/EDR (Oscillator/Pulse)</b></font>
	            <font size="1">Fundamental Frequency: <b>{Store.getFF('low')} hz</b></font>
	            <input className='low' style={{width:100}}
		            type="range"
		            min={0}
	                max={300}
	                defaultValue={Store.getFF('low')}
	                onMouseUp={this.handleFF.bind(this)}
	            />
	            <font size="1">Modulation Depth: <b>{Store.getModDepth('low')}%</b></font>
	            <input className='low' style={{width:100}}
		            type="range"
		            min={0}
	                max={500}
	                defaultValue={Store.getModDepth('low')}
	                onMouseUp={this.handleModDepth.bind(this)}
	            />
	            <font size="1">Max Data Val: <b>{Store.getMaxVal('low')}</b></font>
	            <input className='low' style={{width:100}}
		            type="range"
		            min={0}
	                max={10}
	                step={0.1}
	                defaultValue={Store.getMaxVal('low')}
	                onMouseUp={this.handleMaxVal.bind(this)}/>
	            <font size="1">Gain <b>{Store.getScatterGain('low')}</b></font>
	            <input className='low' style={{width:100}}
		            type="range"
		            min={0}
	                max={1}
	                step={0.05}
	                defaultValue={Store.getScatterGain('low')}
	                onMouseUp={this.handleScatterGain.bind(this)}/>

	           {/* ________ */}


	            <font color="white" size="2"><b>EDA (White Noise)</b></font>
	            <font size="1">Fundamental Frequency: <b>{Store.getFF('noise')} hz</b></font>
	            <input className='noise' style={{width:100}}
		            type="range"
		            min={0}
	                max={300}
	                defaultValue={Store.getFF('noise')}
	                onMouseUp={this.handleFF.bind(this)}
	            />
	            <font size="1">Modulation Depth: <b>{Store.getModDepth('noise')}%</b></font>
	            <input className='noise' style={{width:100}}
		            type="range"
		            min={0}
	                max={500}
	                defaultValue={Store.getModDepth('noise')}
	                onMouseUp={this.handleModDepth.bind(this)}
	            />
	            <font size="1">Max Data Val: <b>{Store.getMaxVal('noise')}</b></font>
	            <input className='noise' style={{width:100}}
		            type="range"
		            min={0}
	                max={10}
	                step={0.1}
	                defaultValue={Store.getMaxVal('noise')}
	                onMouseUp={this.handleMaxVal.bind(this)}/>
	            <font size="1">Gain <b>{Store.getScatterGain('noise')}</b></font>
	            <input className='noise' style={{width:100}}
		            type="range"
		            min={0}
	                max={1}
	                step={0.05}
	                defaultValue={Store.getScatterGain('noise')}
	                onMouseUp={this.handleScatterGain.bind(this)}/>


	                    {/* ________ */}

	            {/*
	            <font color="white" size="2"><b>EDR (Envelope Synth)</b></font>
	            <font size="1">Bin. Scatter Freq: <b>{Store.getScatterFreq('scatter')}</b></font>
	            <input className='scatter' style={{width:100}}
		            type="range"
		            min={70}
	                max={2000}
	                defaultValue={Store.getScatterFreq('scatter')}
	                onMouseUp={this.handleScatterFreq.bind(this)}/>
	            <font size="1">Bin. Scatter Gain <b>{Store.getScatterGain('scatter')}</b></font>
	            <input className='scatter' style={{width:100}}
		            type="range"
		            min={0}
	                max={1}
	                step={0.05}
	                defaultValue={Store.getScatterGain('scatter')}
	                onMouseUp={this.handleScatterGain.bind(this)}/>
	            */}
	            <font color="white" size="2"><b>Step Count (Click Synth)</b></font>
	            <font size="1">Cutoff Freq: <b>{Store.getScatterFreq('clicks')}</b></font>
	            <input className='clicks' style={{width:100}}
		            type="range"
		            min={500}
	                max={4000}
	                defaultValue={Store.getScatterFreq('clicks')}
	                onMouseUp={this.handleScatterFreq.bind(this)}/>
	            <font size="1">Clicks Gain <b>{Store.getScatterGain('clicks')}</b></font>
	            <input className='clicks' style={{width:100}}
		            type="range"
		            min={0}
	                max={1}
	                step={0.05}
	                defaultValue={Store.getScatterGain('clicks')}
	                onMouseUp={this.handleScatterGain.bind(this)}/>


	     		</Menu>
		    <Well bsSize="sm">
		    <ButtonToolbar>


		    <Col xs={4} md={4}>
		    {/*
		    <Button className="slide" onClick={this.handleSlide.bind(this,0)}>Beginning</Button>
			<Button className="slide" onClick={this.handleSlide.bind(this,-1)}>Left Slide</Button>
			<Button className="slide" onClick={this.handleSlide.bind(this,1)}>Right Slide</Button>
			*/}
			{/*
			<Button bsSize="xsmall" onClick={this.download_data}>Download</Button>
			<Button bsSize="xsmall" className="play" onClick={this.handlePlay}>Play</Button>
			<Button bsSize="xsmall" className="pause" onClick={this.handlePause}>Pause</Button>
			*/}
			{/*<Button className="pause" onClick={this.handleCollapse}>Collapse</Button>*/}

			 <DropdownButton bsSize="xsmall" title="Synth Modes" id="bg-nested-dropdown">
		      <MenuItem id='0' onClick={this.handleSynth} active={(this.state.activeTab.synth === 'WebAudioOsc') ? true : false}>Oscillators</MenuItem>
		      <MenuItem id='1' onClick={this.handleSynth} active={(this.state.activeTab.synth === 'DirectSynth') ? true : false}>Direct Synthesis</MenuItem>
		    </DropdownButton>
		    <Button bsSize="xsmall" className="tickreset" onClick={this.handleResetTick}>Reset Ticker</Button>
		    <Button bsSize="xsmall" className="toggleData" onClick={this.handleDataToggle}>Toggle Data</Button>
		    <Button bsSize="xsmall" className="collapse_list" onClick={this.handleCollapse}>Collapse</Button>
			{/*
			<Button className='shrinkwindow" onClick={this.handleExtend.bind(this,-1)}>Shrink</Button>
			<Button className="extendwindow" onClick={this.handleExtend.bind(this,1)}>Extend</Button>
			*/}

			</Col>
			  	<Col xs={2} md={2}>
				<font size="2">Tempo: <b>{Store.getTempo()} bpm</b></font>
           		</Col>
            	<Col xs={3} md={3}>
            <input type="checkbox" name="spatialize" value="true" onClick={this.handleClick.bind(this)} defaultChecked /> <b> Spatialize newly created nodes </b> <br />
            	</Col>

            	<Col>


			     <Button bsSize="xsmall" bsStyle="primary" className="UserStudy" onClick={this.handleNextSample}>Done Analyzing Sample</Button>
			  	</Col>
			  	<Col>
			  	{/*
			  	  <ButtonGroup>
			  	}
            	<Button bsSize="xsmall" name = 'TUT' active={(this.state.viewing_mode === 'TUT') ? true : false} onClick={this.changeMode}>TUT</Button>
			    <Button bsSize="xsmall" name = 'A' active={(this.state.viewing_mode === 'A') ? true : false} onClick={this.changeMode}>A</Button>
			    <Button bsSize="xsmall" name = 'V' active={(this.state.viewing_mode === 'V') ? true : false} onClick={this.changeMode}>V</Button>
			    <Button bsSize="xsmall" name = 'AVS' active={(this.state.viewing_mode === 'AVS') ? true : false} onClick={this.changeMode}>AVS</Button>
			    <Button bsSize="xsmall" name = 'AVD' active={(this.state.viewing_mode === 'AVD') ? true : false} onClick={this.changeMode}>AVD</Button>
			  </ButtonGroup>
			*/}
			  <div>
			  	  <span style={{paddingRight:11}}><b>Calm</b></span>
			 	  <input type="radio" checked={this.state.stress === '1'} onChange={this.onStressSelect} name='stress' value='1'/>
				  <input type='radio' checked={this.state.stress === '2'} onChange={this.onStressSelect} name='stress' value='2'/>
				  <input type='radio' checked={this.state.stress === '3'} onChange={this.onStressSelect} name='stress' value='3'/>
				  <input type='radio' checked={this.state.stress === '4'} onChange={this.onStressSelect} name='stress' value='4'/>
				  <input type='radio' checked={this.state.stress === '5'} onChange={this.onStressSelect} name='stress' value='5'/>
				  <span style={{paddingLeft:11}}><b>Stressed</b></span>
				  </div>
				  <div>
				 <span style={{paddingLeft:11, paddingRight:11}}><b>Still</b></span>
			 	  <input type='radio' checked={this.state.activity === '1'} onChange={this.onActivitySelect} name='activity' value='1'/>
				  <input type='radio' checked={this.state.activity === '2'} onChange={this.onActivitySelect} name='activity' value='2'/>
				  <input type='radio' checked={this.state.activity === '3'} onChange={this.onActivitySelect} name='activity' value='3'/>
				  <input type='radio' checked={this.state.activity === '4'} onChange={this.onActivitySelect} name='activity' value='4'/>
				  <input type='radio' checked={this.state.activity === '5'} onChange={this.onActivitySelect} name='activity' value='5'/>
				  <span style={{paddingLeft:11}}><b>Active</b></span>
				  </div>

            	</Col>





			</ButtonToolbar>
			</Well>





		 	<div>
				<Grid fluid={true}>
				<Row>

				<Col xs={2} md={1}>

					<div><h5>Upload Zone:</h5></div>
					<Row><Col><UploadZone onDrop={this.handleFile}><div>Drag data files here</div></UploadZone></Col></Row>

					<Row><Col><UploadZone onDrop={this.handleSuperposition}><div>Drag superposition data file here</div></UploadZone></Col></Row>

				</Col>
				<Col xs={12} md={2}>
				<h2>Audio:</h2>

					<Button bsSize="xsmall" className="cluster" onClick={this.handleCluster}>Finalize Node Cluster</Button>

				{this.state.AudStreams.map((stream,i) =>
					<div key={i} style={{paddingBottom:5}}>
						<AudioItem
							key={i}
							ID={i}
							stream={stream}
							location={this.find_plot_Index(stream.get('ID'))}
							type={stream.get('SwipeState')}
							context={this.audioCtx}
							spb={this.state.spb}
							setbeat={this.setbeatTime.bind(this)}
							approxbeat={this.state.approxbeat}
							setNextTime={this.setNextTime.bind(this)}
							nextTime={this.nextTime}
							AMSScale={this.AMSScale}
							AMSInvScale={this.AMSInvScale}
							center={this.scaled_coords}
							spatialize={Store.getSpatialize()}
							fft={stream.get('fft')}
							synth={this.state.activeTab.synth}
							scale_factor={Store.getScaleFactor(stream.get('plot_mode'))}
							ff={Store.getFF(stream.get('plot_mode'))}
							freq={Store.getScatterFreq(stream.get('plot_mode'))}
							gain={Store.getScatterGain(stream.get('plot_mode'))}




						/>

					</div>)}
				<h2>Clusters:</h2>
				<ClusterText />
				{/*Store.getClustNum().map((cluster) =>
					<div>{cluster.contents.map((i => <span>{Store.getStream(i).get('header')}, </span>))}
					</div>)
				*/}
 				</Col>
				<Col xs={4} md={6}>
				<ListViz
					Streams={this.state.VizStreams}
					findPlotIndex={this.find_plot_Index}
					shift={Store.getShift()}
					slidestate={Store.getSlideState()}
					beatnum={this.tick}
					spb={this.state.spb}
					synth={this.state.activeTab.synth}
					collapsed={this.state.collapsed}
				/></Col>
				<Col xs={5} md={3}>
					<AudCluster ref={'nodes'} Streams={this.state.allStreams} findPlotIndex={this.find_plot_Index} UI={this.state.UI}/>

				</Col>

				</Row>
				</Grid>
			</div>


		</div>
    );
  }
};

export default DragDropContext(HTML5Backend)(MainContainer);



