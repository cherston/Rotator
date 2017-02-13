import React, {Component} from 'react';
import ReactDOM from 'react-dom';
import d3 from 'd3';
import Actions from '../Actions';
import Dimensions from 'react-dimensions';

//require('./NewLineChart.scss');

class MultiPlot extends Component {

	constructor(props) {
		super(props);

		this._chartComponents = this._chartComponents.bind(this);
		this._brushComponents = this._brushComponents.bind(this);
		this._initializeChart = this._initializeChart.bind(this);
		this._initializeBrusher = this._initializeBrusher.bind(this);
		this._updateChart = this._updateChart.bind(this);
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
		//6/3
		//return nextProps.position != this.props.position || nextProps.shift != this.props.shift
		return false
	};

	componentWillReceiveProps(nextProps) {
		console.log('new position: ' + nextProps.position + ' old position: ' + this.props.position);
		console.log('new beatnum: ' + nextProps.beatnum + ' old beatnum: ' + this.props.beatnum);
		if(
			nextProps.beatnum !== this.props.beatnum
			|| nextProps.position !== this.props.position
			|| nextProps.shift !== this.props.shift
			|| nextProps.all_data !== this.props.all_data)
			this._updateChart(nextProps)


	}
	_chartComponents(nextprops) {
		const {height, all_data, position, shift, beatnum} = nextprops;
		const containerWidth = this.props.containerWidth;
		//console.log('in chart components with container width: ' + containerWidth);
		const innerMargin = { top: 10, right: 75, bottom: 20, left: 30 };
		var points = null;
		var data_range = null;

		var points_list = all_data.map(function(stream){
					console.log('calculating new points_list in chartcomponents. First stream length: ' + stream[0].data.length +
						' position: ' + position + ' shift: ' + shift);
					var data_range = stream[0].data.slice(position,position+shift);
					return data_range.map((d, i) => ({ x: i + position, y: d}));
		});




		//console.log('data points excerpt: ' + data_range.slice(0,10));
		//console.log('calling chartcomponents with position = ' + position + 'and shift: ' + shift);
		//console.log('first in data: ' + JSON.stringify(data_range.map(function(d) {return(parseFloat(d))})));
		//const points = data_range.map((d, i) => ({ x: i + position, y: d}));

		//console.log('points in window: ' + JSON.stringify(points));
		const x = d3.scale.linear().domain(d3.extent(points_list.get(0).map(d => d.x))).range([0, containerWidth - innerMargin.left - innerMargin.right]);
		const y = d3.scale.linear().domain([0,1]).range([height - innerMargin.top - innerMargin.bottom, 0]);
		//FOR CONSTANT Y SCAL
		//const y = d3.scale.linear().domain([5,20]).range([height - innerMargin.top - innerMargin.bottom, 0]);

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
			points_list,
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

 		var points_list = all_data.map(function(stream){
					//console.log('stream: ' + JSON.stringify(stream));
					var data_range = stream[0].data;
					return data_range.map((d, i) => ({ x: i, y: d}));
		});



		const x = d3.scale.linear().domain(d3.extent(points_list.get(0).map(d => d.x))).range([0, containerWidth - innerMargin.left - innerMargin.right]);
		const y = d3.scale.linear().domain([0,1]).range([height/6 - innerMargin.top - innerMargin.bottom, 0]);
		//console.log('x scale now goes up to: ' + (containerWidth - innerMargin.left - innerMargin.right));


		const xAxis = d3.svg.axis()
			.scale(x)
			.orient('bottom');

		const yAxis = d3.svg.axis()
			.scale(y)
			.orient('left');

		const brush = d3.svg.brush()
			.x(x)
			.on('brushend', () => this._handleBrushed(brush));
		console.log('position: ' + position + 'shift: ' + shift);
		brush.extent([position, position+shift-1]);
		//console.log('height is: ' + height);

		return {
			containerWidth,
			height,
			x,
			y,
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
		const { line, points_list, innerMargin, height, xAxis, yAxis, curLine, location, x, y} = this._chartComponents(this.props);
		const { shift, plot_mode, all_data } = this.props;

		var color = d3.scale.category10();





		console.log('x(3):' + x(8));
		// draw the initial
		const svg = d3.select(ReactDOM.findDOMNode(this.refs.svg))
			.append('g')
			.attr('class', 'inner-chart')
			.attr('transform', `translate(${innerMargin.left} ${innerMargin.top})`);

		var colors = d3.scale.category10();

		all_data.map(function(stream,i){
			if(stream.plot_mode === 'scatter')
				this._makeScatterPlot(svg, points_list.get(i), x, y, color(i), i);
			else
				this._makeLinePlot(svg, points_list.get(i), line, color(i), i);
		}.bind(this));

		/*
		var legendRectSize = 8;
		var legendSpacing = 8;

		var legend = svg.selectAll('.legend')
				.data(color.domain())
				.enter()
				.append('g')
				.attr('class', 'legend')
				.attr('transform', function(d, i) {
				    var height = legendRectSize + legendSpacing;
				    var offset =  height * color.domain().length / 2;
				    var horz = -2 * legendRectSize;
				    var vert = i * height - offset;
				    return 'translate(' + horz + ',' + vert + ')'; });

		  legend.append('rect')
				.attr('x', 650 - 20)
				.attr('y', function(d, i){ return i *  10;})
				.attr('width', 8)
				.attr('height', 8)
				.style('fill', function(d) {
				return color(d.name);
				});

		  legend.append('text')
				.attr('x', 280 - 8)
				.attr('y', function(d, i){ return (i *  20) + 9;})
				.text(function(d){ return 'test'; });
			*/

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

	_makeScatterPlot(svg, points, x, y, color){

	 svg.selectAll('.dot')
      .data(points.filter(function(d){ return d.y > 0 }))
   	  .enter().append('circle')
      .attr('class', 'dot')
      .attr('r', 3.5)
      .attr('cx', (d) => x(d.x))
      .attr('cy', (d) => y(d.y))
      .style('fill', function(d) { return 'red' })

	}

	_makeLinePlot(svg, points, line, color, i){
		console.log('color: ' + color);
		svg.append('g')
			.attr('class', 'line' + String(i))
			.append('path')
				.datum(points)
				.attr('d', d => line(d))
				.attr('stroke', d => color)
	}

	_updateLinePlot(svgitem, points, line, i){

		svgitem.selectAll('.line' + String(i) + ' path')
		.datum(points)
		.attr('d', d => line(d))
	}



	_initializeBrusher() {
		const {innerMargin, brush, height, xAxis, yAxis} = this._brushComponents(this.props);
		this._chartComponents(this.props);
		const brusher = d3.select(ReactDOM.findDOMNode(this.refs.brusher))
		.append('g')
			.attr('class', 'inner-chart')
			.attr('transform', `translate(${innerMargin.left} ${innerMargin.top})`);



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



	_updateChart(nextProps) {
		const { line, points_list, xAxis, yAxis, innerMargin, curLine, location, x, y} = this._chartComponents(nextProps);
		const { brush, brushline } = this._brushComponents(nextProps);
		const { shift, synth, plot_mode, all_data } = nextProps;
		const containerWidth = this.props.containerWidth;

		// draw the initial
		//console.log('declaring svg');
		const svgitem = d3.select(ReactDOM.findDOMNode(this.refs.svg)).select('.inner-chart');
		const brusher = d3.select(ReactDOM.findDOMNode(this.refs.brusher)).select('.inner-chart');
		var colors = d3.scale.category10();

		all_data.map(function(stream,i){
			if(stream.plot_mode === 'scatter')
			{
				svgitem.selectAll('.dot').remove();
				this._makeScatterPlot(svgitem, points_list.get(i), x, y, color(i));
			}
			else
			{
				this._updateLinePlot(svgitem, points_list.get(i), line, i);
			}
		}.bind(this));

		svgitem.attr('width',  0.95 * containerWidth);
		svgitem.attr('width', d => 0.95 * containerWidth);
		//brusher.attr('width', d=>0.95 * containerWidth);




		if(synth !='DirectSynth')
		{
		 svgitem.selectAll('.location path')
			.attr('d', d => curLine([[location,0],[location,400]]))
			.attr('stroke','darkred');
		}



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

	render() {
		console.log('in multiplot render');
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

export default Dimensions()(MultiPlot);
