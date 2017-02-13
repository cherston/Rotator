import React, {Component} from 'react';
import ReactDOM from 'react-dom';
import d3 from 'd3';
import Actions from '../Actions';
import Dimensions from 'react-dimensions';


class Ticker extends Component {

	constructor(props) {
		super(props);

		this._chartComponents = this._chartComponents.bind(this);
 		this._initializeChart = this._initializeChart.bind(this);
 		this._updateChart = this._updateChart.bind(this);
	}


	componentDidMount() {
		this._initializeChart();

 	};

	shouldComponentUpdate(nextProps, nextState){

 		return false
	};

	componentWillReceiveProps(nextProps) {
		console.log('in WRP ticker');
		if(nextProps.beatnum !== this.props.beatnum
			|| nextProps.position !== this.props.position)
		{
				console.log('updating ticker');
				this._updateChart(nextProps)

		}


	}
	_chartComponents(nextprops) {
		const {all_data, height, position, shift, beatnum,fft} = nextprops;
		const containerWidth = this.props.containerWidth;
		//console.log('in chart components with container width: ' + containerWidth);
		const innerMargin = { top: 10, right: 75, bottom: 20, left: 30 };

		var points = null;
		var data_range = null;

		if(fft === null)
		{
			data_range = all_data.slice(position,position+shift);
			points = data_range.map((d, i) => ({ x: i + position, y: d}));
		}
		else
			points = fft.slice(0,50);


		const x = d3.scale.linear().domain(d3.extent(points.map(d => d.x))).range([0, containerWidth - innerMargin.left - innerMargin.right]);
		const location = x(beatnum + position);

		const curLine = d3.svg.line();



		return {
			containerWidth,
			height,
			innerMargin,
			curLine,
			location,
		};
	};

	_initializeChart() {
		const {innerMargin, height, curLine, location} = this._chartComponents(this.props);




		// draw the initial
		const svg = d3.select(ReactDOM.findDOMNode(this.refs.svg)).select('.inner-chart');
		console.log('svg: ' + svg);
		svg.append('g')
		 	.attr('class', 'location')
		  	.append('path')
		  	.attr('d', d => curLine([[location,0],[location,400]]))
		  	.attr('stroke','darkred');




	};



	_updateChart(nextProps) {
		const { line, points, xAxis, yAxis, innerMargin, curLine, location, x, y} = this._chartComponents(nextProps);

		const {synth} = nextProps;
		const containerWidth = this.props.containerWidth;


		// draw the initial
		//console.log('declaring svg');
		const svgitem = this.props.svg

		console.log('svgitem: ' + svgitem);
		console.log('updating ticker.....');
		if(synth !='DirectSynth')
		{
		 svgitem.selectAll('.location path')
			.attr('d', d => curLine([[location,0],[location,400]]))
			.attr('stroke','darkred');
		}


	};

	render() {


		return (
			null
		);
	}
};

export default Dimensions()(Ticker);
