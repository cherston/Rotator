import React, {Component} from 'react';
import ReactDOM from 'react-dom';
import d3 from 'd3';
import Actions from '../Actions';
import Dimensions from 'react-dimensions';

//require('./NewLineChart.scss');

class NewLineChart extends Component {

	constructor(props) {
		super(props);

		this._chartComponents = this._chartComponents.bind(this);
		this._brushComponents = this._brushComponents.bind(this);
		this._initializeChart = this._initializeChart.bind(this);
		this._initializeBrusher = this._initializeBrusher.bind(this);
		this._updateChart = this._updateChart.bind(this);
		this.getsvgitem = this.getsvgitem.bind(this);
	}

/*
	getDefaultProps() {
		return {
			width: 500,
			height: 400,
			data: [{ x: 1, y: 10 }, { x: 2, y: 80 }, { x: 3, y: 50 }]
		};
	};
*/
	componentDidMount() {
		this._initializeChart();
		this._initializeBrusher();
		//console.log('finished updating line chart');
	};
	/*
	componentDidUpdate() {
		this._updateChart();
	};
	*/
	shouldComponentUpdate(nextProps, nextState){
		return false
	};

	componentWillReceiveProps(nextProps) {
		if(
			nextProps.beatnum !== this.props.beatnum
			|| nextProps.position !== this.props.position
			|| nextProps.shift !== this.props.shift
			|| nextProps.fft !== this.props.fft
			|| nextProps.all_data !== this.props.all_data)
		{
			this._updateChart(nextProps)
			this._updateTicker(nextProps);

		}
	}
	_chartComponents(nextprops) {
		const {height, all_data, position, shift, fft, beatnum} = nextprops;
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

		//console.log('data points excerpt: ' + data_range.slice(0,10));
		//console.log('calling chartcomponents with position = ' + position + 'and shift: ' + shift);
		//console.log('first in data: ' + JSON.stringify(data_range.map(function(d) {return(parseFloat(d))})));
		//const points = data_range.map((d, i) => ({ x: i + position, y: d}));
		console.log('first point: ' + JSON.stringify(points[0]));
		//console.log('points in window: ' + JSON.stringify(points));
		var y_extent = d3.extent(points.map(d => d.y));
		y_extent[0] -= 0.1;
		y_extent[1] += 0.1;
		const x = d3.scale.linear().domain(d3.extent(points.map(d => d.x))).range([0, containerWidth - innerMargin.left - innerMargin.right]);
		const y = d3.scale.linear().domain(y_extent).range([height - innerMargin.top - innerMargin.bottom, 0]);
		//FOR CONSTANT Y SCAL
		//const y = d3.scale.linear().domain([-0.1,40.1]).range([height - innerMargin.top - innerMargin.bottom, 0]);

		const line = d3.svg.line()
			.interpolate('cardinal')
			.x(d => x(d.x))
			.y(d => y(d.y));

		const location = x(beatnum + position);
		console.log('beatnum: ' + beatnum + 'location: ' + location);
		const curLine = d3.svg.line();

		const xAxis = d3.svg.axis()
			.scale(x)
			.orient('bottom');

		const yAxis = d3.svg.axis()
			.scale(y)
			.orient('left');

		return {
			containerWidth,
			height,
			x,
			y,
			line,
			points,
			innerMargin,
			xAxis,
			yAxis,
			curLine,
			location,
		};
	};
	_brushComponents(nextprops) {
		const { containerWidth, height, all_data, position, shift } = nextprops;

 		const innerMargin = { top: 10, right: 75, bottom: 10, left: 30 };


		const points = all_data.map((d, i) => ({ x: i, y: d }));

		const x = d3.scale.linear().domain(d3.extent(points.map(d => d.x))).range([0, containerWidth - innerMargin.left - innerMargin.right]);
		const y = d3.scale.linear().domain(d3.extent(points.map(d => d.y))).range([height/6 - innerMargin.top - innerMargin.bottom, 0]);

		this.x = x;

		//console.log('x scale now goes up to: ' + (containerWidth - innerMargin.left - innerMargin.right));
		console.log('position: ' + position + 'shift: ' + shift);
		const brushline = d3.svg.line()
			.interpolate('cardinal')
			.x(d => x(d.x))
			.y(d => y(d.y));

		const xAxis = d3.svg.axis()
			.scale(x)
			.orient('bottom');

		const yAxis = d3.svg.axis()
			.scale(y)
			.orient('left');

		const brush = d3.svg.brush()
			.x(x)
			.on('brushend', () => this._handleBrushed(brush));

		brush.extent([position, position+shift-1]);
		//console.log('height is: ' + height);

		return {
			containerWidth,
			height,
			x,
			y,
			brushline,
			points,
			innerMargin,
			brush,
			xAxis,
			yAxis
		};

	};

	_handleBrushed(brush) {
		console.log('brushed! extent: ' + brush.extent()[0] + ',' + brush.extent()[1]);
		Actions.adjustBrushWindow(brush.extent());
		//Actions.slide(1);


	};

	_initializeChart() {
		const { line, points, innerMargin, height, xAxis, yAxis, curLine, location, x, y} = this._chartComponents(this.props);
		const { shift, plot_mode } = this.props;


		console.log('x(3):' + x(8));
		// draw the initial
		const svg = d3.select(ReactDOM.findDOMNode(this.refs.svg))
			.append('g')
			.attr('class', 'inner-chart')
			.attr('transform', `translate(${innerMargin.left} ${innerMargin.top})`);

		console.log('svg: ' + svg);

		if(plot_mode === 'clicks')
		{
			this._makeScatterPlot(svg, points, x, y);
		}
		else
		{
			this._makeLinePlot(svg, points, line);
		}

		svg.append('g')
		 	.attr('class', 'location')
		  	.append('path')
		  	.attr('d', d => curLine([[location,0],[location,400]]))
		  	.attr('stroke','darkred');



		svg.append('g')
			.attr('class','x axis')
			.attr('transform', `translate(${0} ${height - 30})`)
			.call(xAxis)

		svg.append('g')
			.attr('class','y axis')
			.attr('transform', `translate(${0} ${0})`)
			.call(yAxis)



	};

	_makeScatterPlot(svg, points, x, y){

	 svg.selectAll('.dot')
      .data(points.filter(function(d){ return d.y > 0.05 }))
   	  .enter().append('circle')
      .attr('class', 'dot')
      .attr('r', 3.5)
      .attr('cx', (d) => x(d.x))
      .attr('cy', (d) => y(d.y))
      .style('fill', function(d) { return 'red' })

	}

	_makeLinePlot(svg,points, line){

		svg.append('g')
			.attr('class', 'line')
			.append('path')
				.datum(points)
				.attr('d', d => line(d))
	}


	_initializeBrusher() {
		const { brushline, points, innerMargin, brush, height, xAxis, yAxis} = this._brushComponents(this.props);

		const { all_data }  = this.props;




		const brusher = d3.select(ReactDOM.findDOMNode(this.refs.brusher))
		.append('g')
			.attr('class', 'inner-chart')
			.attr('transform', `translate(${innerMargin.left} ${innerMargin.top})`);

		const brush_points = all_data.map((d, i) => ({ x: i, y: d }));

		brusher.append('g')
			.attr('class', 'brushline')
			.append('path')
				.datum(brush_points)
				.attr('d', d => brushline(d))
				.attr('stroke','#C0C0C0')


		brusher.append('g')
			.attr('class', 'x brush')
			.call(brush)
			.selectAll('rect')
				.attr('y', -6)
				.attr('height', height/3)
				.attr('fill', 'red');

		brusher.append('g')
			.attr('class','x axis')
			.attr('transform', `translate(${0} ${20})`)
 			.call(xAxis);

		//console.log('extent: ' + brush.extent());




	};

	getsvgitem(){
		return d3.select(ReactDOM.findDOMNode(this.refs.svg)).select('.inner-chart');
	}

	_updateLinePlot(svgitem, points, line){
		svgitem.selectAll('.line path')
		.datum(points)
		.attr('d', d => line(d))
	}

	_updateChart(nextProps) {
		const { line, points, xAxis, yAxis, innerMargin, curLine, location, x, y} = this._chartComponents(nextProps);
		const { brush, brushline } = this._brushComponents(nextProps);
		const { shift, synth, plot_mode, all_data } = nextProps;
		const containerWidth = this.props.containerWidth;

		console.log('all_data length in update chart: ' + all_data.length);
		// draw the initial
		//console.log('declaring svg');
		const svgitem = d3.select(ReactDOM.findDOMNode(this.refs.svg)).select('.inner-chart');
		const brusher = d3.select(ReactDOM.findDOMNode(this.refs.brusher)).select('.inner-chart');


		const brush_points = all_data.map((d, i) => ({ x: i, y: d }));
		console.log('all_data length in brush_points: ' + brush_points.length);

		brusher.selectAll('.brushline path')
			.datum(brush_points)
			.attr('d', d => brushline(d))

		svgitem.attr('width',  0.95 * containerWidth);
		svgitem.attr('width', d => 0.95 * containerWidth);
		//brusher.attr('width', d=>0.95 * containerWidth);

		if(plot_mode === 'clicks')
		{
			svgitem.selectAll('.dot').remove();
	 		this._makeScatterPlot(svgitem, points, x, y);
	 	}
	 	else
	 	{
 			this._updateLinePlot(svgitem, points, line);
	 	}

	 	/*
		if(synth !='DirectSynth')
		{
		 svgitem.selectAll('.location path')
			.attr('d', d => curLine([[location,0],[location,400]]))
			.attr('stroke','darkred');
		}

		*/

		svgitem.selectAll('.x.axis')
			.attr('width', d => 0.95 * containerWidth)
			.call(xAxis);

		svgitem.selectAll('.y.axis')
			.attr('width', d => 0.95 * containerWidth)
			.call(yAxis);

		brusher.select('brush')
			.transition()

		brush(brusher.select('.brush'));
		//console.log('new extent: ' + brush.extent());

	};
	_updateTicker(nextProps){
		const {beatnum, position, synth} = nextProps;
		const {location, curLine} = this._chartComponents(this.props);
 		console.log('curline: ' + curLine);
		const svgitem = d3.select(ReactDOM.findDOMNode(this.refs.svg)).select('.inner-chart');
		if(synth !='DirectSynth')
		{
		 svgitem.selectAll('.location path')
			.attr('d', d => curLine([[location,0],[location,400]]))
			.attr('stroke','darkred');
		}

	}

	render() {
		const { containerWidth, height } = this.props;

		return (
			<div>
				<div >
					<svg style={{width: containerWidth, paddingLeft:20}} height={height} ref='svg' />
				</div>
				{
				<div style={{backgroundColor:'Ivory', borderRadius:0, paddingLeft:20}}>
					<svg style={{width: containerWidth, height: height/3.5}} ref='brusher' />
				</div>
				}
			</div>
		);
	}
};

export default Dimensions()(NewLineChart);
