var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

var React = require('react');
var d3 = require('d3');

var Chart = require('./Chart');
var Axis = require('./Axis');
var Tooltip = require('./Tooltip');

var DefaultPropsMixin = require('./DefaultPropsMixin');
var HeightWidthMixin = require('./HeightWidthMixin');
var ArrayifyMixin = require('./ArrayifyMixin');
var AccessorMixin = require('./AccessorMixin');
var DefaultScalesMixin = require('./DefaultScalesMixin');
var TooltipMixin = require('./TooltipMixin');

var Actions = require('../../../src/Actions.js');
var Store = require('../../../src/Store.js');

var DataSet = React.createClass({
	displayName: 'DataSet',

	propTypes: {
		data: React.PropTypes.array.isRequired,
		symbol: React.PropTypes.func.isRequired,
		xScale: React.PropTypes.func.isRequired,
		yScale: React.PropTypes.func.isRequired,
		colorScale: React.PropTypes.func.isRequired,
		onMouseEnter: React.PropTypes.func,
		onMouseLeave: React.PropTypes.func
	},
	getMode: function getMode(xcoord,ycoord){
		//console.log('in getMode with coordinates: ' + xcoord + ' ' + ycoord);
		var _props = this.props;
		var xScale = _props.xScale;
		var yScale = _props.yScale;
		var data = _props.data;
		var values = _props.values;
		var x = _props.x;
		var y = _props.y;
		var audRegion = _props.audBounds;
		var vizRegion = _props.vizBounds;
		var inViz = function inViz(xcoord,ycoord){
			return(xScale(xcoord) > vizRegion.get('left') - 50 &&
					xScale(xcoord) < vizRegion.get('left')+vizRegion.get('width')  - 50
					&& yScale(ycoord) > vizRegion.get('top') - 10 && yScale(ycoord) < vizRegion.get('top') + vizRegion.get('length') - 15)
		};
		var inAud = function inAud(xcoord,ycoord){
			return(xScale(xcoord) > audRegion.get('left') - 50 &&
					xScale(xcoord) < audRegion.get('left')+audRegion.get('width')  - 50
					&& yScale(ycoord) > audRegion.get('top') - 10 && yScale(ycoord) < audRegion.get('top') + audRegion.get('length') - 15)
		};
		var get_mode = function(xcoord,ycoord){
			var mode;
			if(inViz(xcoord,ycoord) && inAud(xcoord,ycoord))
				mode = 'av'
			else if(inViz(xcoord,ycoord))
				mode = 'v'
			else if(inAud(xcoord,ycoord))
				mode = 'a'
			else
				mode = 'n'
			//console.log(mode);
			return mode
		};
		return (get_mode(xcoord,ycoord));
	},

	getModes: function getModes(){
		var _props = this.props;
		var data = _props.data;
		var values = _props.values;
		var x = _props.x;
		var y = _props.y;
		var _getMode = this.getMode;

		return (
			data.map(function (stack) {
				 return(values(stack).map((el,index) =>
					(
						 	(el.ref != null) ? ({ref:el.ref, mode:_getMode(x(el),y(el))}) : null
					)
				))

			})
		)
	},


	render: function render() {

		var _props = this.props;
		var data = _props.data;

		var symbol = _props.symbol;
		var xScale = _props.xScale;
		var yScale = _props.yScale;
		var colorScale = _props.colorScale;
		var label = _props.label;
		var values = _props.values;
		var x = _props.x;
		var y = _props.y;
		var onMouseEnter = _props.onMouseEnter;
		var onMouseLeave = _props.onMouseLeave;
		var audRegion = _props.audBounds;
		var vizRegion = _props.vizBounds;
		var CSS_COLOR_NAMES = ['DarkSeaGreen', 'Indigo','PaleVioletRed','Cyan','LimeGreen','Azure','Black',
								'BlanchedAlmond','Blue','BlueViolet','Brown','BurlyWood','CadetBlue','Chartreuse','Chocolate',
								'Coral','CornflowerBlue','Cornsilk','DarkBlue','DarkCyan','DarkGoldenRod','DarkGray',
								'DarkGrey','DarkGreen','DarkKhaki','DarkMagenta','DarkOliveGreen','Darkorange','DarkOrchid','DarkRed',
								'DarkSlateBlue','DarkSlateGray','DarkSlateGrey','DarkTurquoise','DarkViolet',
								'DeepPink','DeepSkyBlue','DimGray','DimGrey','DodgerBlue','FireBrick','FloralWhite','ForestGreen',
								'Gainsboro','GhostWhite','Gold','GoldenRod','Gray','Grey','Green','GreenYellow','HoneyDew','HotPink','IndianRed',
								'LavenderBlush','LawnGreen','LemonChiffon','LightBlue','LightCoral','LightCyan',
								'DarkSalmon', 'LightGoldenRodYellow','LightGray','LightGrey','LightGreen','LightPink','LightSalmon','LightSeaGreen','LightSkyBlue',
								'LightSlateGray','LightSlateGrey','LightSteelBlue','LightYellow','Lime','LimeGreen','Linen','Magenta','Maroon',
								'MediumAquaMarine','MediumBlue','MediumOrchid','MediumPurple','MediumSeaGreen','MediumSlateBlue','MediumSpringGreen',
								'MediumTurquoise','MediumVioletRed','MidnightBlue','MintCream','MistyRose','Moccasin','NavajoWhite','Navy','OldLace',
								'Olive','OliveDrab','Orange','OrangeRed','Orchid','PaleGoldenRod','PaleGreen','PaleTurquoise','PapayaWhip',
								'PeachPuff','Peru','Pink','Plum','PowderBlue','Purple','Red','RosyBrown','RoyalBlue','SaddleBrown','Salmon','SandyBrown',
								'SeaGreen','SeaShell','Sienna','Silver','SkyBlue','SlateBlue','SlateGray','SlateGrey','Snow','SpringGreen','SteelBlue',
								'Tan','Teal','Thistle','Tomato','Turquoise','Violet','Wheat','White','WhiteSmoke','Yellow','YellowGreen'];

		//var audRegion = Store.getAudZone();
		//var vizRegion = Store.getVizZone();

		var circles = data.map(function (stack) {
			return values(stack).map(function (e, index) {
				var translate = 'translate(' + xScale(x(e)) + ', ' + yScale(y(e)) + ')';
				//console.log('rendering a circle');
				//console.log(translate);
				symbol.size(function(d) {return 60});
				//console.log('x(e): ' + x(e));
				//console.log('xScale(7):' + xScale(7));
				//console.log('ref: ' + e.ref);

				var color;
				//xScale: 255 yScale: 85
				var inVizChecker = function(x,y){return(xScale(x) > vizRegion.get('left') - 50 &&
					xScale(x) < vizRegion.get('left')+vizRegion.get('width')  - 50
					&& yScale(y) > vizRegion.get('top') - 10 && yScale(y) < vizRegion.get('top') +
					vizRegion.get('length') - 15)};
				var inAudChecker = function(x,y){return(xScale(x) > audRegion.get('left') - 50 &&
					xScale(x) < audRegion.get('left')+audRegion.get('width')  - 50
					&& yScale(y) > audRegion.get('top') - 10 && yScale(y) < audRegion.get('top') + audRegion.get('length') - 15)};



				var inViz = inVizChecker(x(e),y(e));
				var inAud = inAudChecker(x(e),y(e));

				var inVizCluster = function(clustermates){
					var candidates = clustermates.filter(function(clustermate){
						return Store.getSwipeState(clustermate) === 'v' || Store.getSwipeState(clustermate) === 'av'
					});
					return(candidates.length > 0)
				};
				var inAudCluster = function(clustermates){
					var candidates = clustermates.filter(function(clustermate){
						return Store.getSwipeState(clustermate) === 'a' || Store.getSwipeState(clustermate) === 'av'
					});
					return(candidates.length > 0)
				};

				var inViz_c = e.clustermates ? inVizCluster(e.clustermates) : false;
				var inAud_c = e.clustermates ? inAudCluster(e.clustermates) : false;
				//console.log('stream: ' + e.ref + ' in viz cluster? ' + inViz_c);
				//console.log(inViz(x(e),y(e)));
				if((inViz || inViz_c) && (inAud || inAud_c))
					color = 'green';
				else if(inViz || inViz_c)
					color = 'red';
				else if(inAud || inAud_c)
					color = 'blue';
				else
				{
					if(e.cluster != null)
					{
						//console.log('cluster: ' + e.cluster);
						color = CSS_COLOR_NAMES[e.cluster]
					}
					else
						color = 'yellow';
				}


				if(e.selected){
					//console.log('e is ' + JSON.stringify(e) + ' so Im making the dot big');
					symbol.size(function(d) {return 300});
				}

				else if(e.cluster != null){
					console.log('e.cluster: for stream: ' + e.ref + ': ' + e.cluster);
					symbol.size(function(d) {return 150});
				}

				if(e.ref != null)
				{
					return React.createElement('path', {
						key: '' + label(stack) + '.' + index,
						className: 'dot',
						d: symbol(),
						transform: translate,
						fill: color,
						strokeWidth: '4',
						//(Math.random() < 0.50) ? colorScale(label(stack)) : 'green',
						onMouseOver: function (evt) {
							onMouseEnter(evt, e);
						},
						onMouseLeave: function (evt) {
							onMouseLeave(evt);
						},
						onClick: function (evt) {

							Actions.cluster(e)

						}
					});
				}
			});
		});

		return React.createElement(
			'g',
			null,
			circles
		);
	}
});

var ScatterPlot = React.createClass({
	displayName: 'ScatterPlot',

	mixins: [DefaultPropsMixin, HeightWidthMixin, ArrayifyMixin, AccessorMixin, DefaultScalesMixin, TooltipMixin],

	propTypes: {
		rScale: React.PropTypes.func,
		shape: React.PropTypes.string
	},

	getDefaultProps: function getDefaultProps() {
		return {
			rScale: null,
			shape: 'circle'
		};
	},

	getModes: function getInViz(){
		return this.refs.dataset.getModes();
	},

	getMode: function getMode(x,y){
		return this.refs.dataset.getMode(x,y);
	},

	_tooltipHtml: function _tooltipHtml(d, position) {
		var xScale = this._xScale;
		var yScale = this._yScale;

		var html = this.props.tooltipHtml(this.props.x(d), this.props.y(d));

		var xPos = xScale(this.props.x(d));
		var yPos = yScale(this.props.y(d));

		return [html, xPos, yPos];
	},

	render: function render() {
		var _props = this.props;
		var height = _props.height;
		var width = _props.width;
		var margin = _props.margin;
		var colorScale = _props.colorScale;
		var rScale = _props.rScale;
		var shape = _props.shape;
		var label = _props.label;
		var values = _props.values;
		var x = _props.x;
		var y = _props.y;
		var xAxis = _props.xAxis;
		var yAxis = _props.yAxis;
		var data = this._data;
		var innerWidth = this._innerWidth;
		var innerHeight = this._innerHeight;
		var xScale = this._xScale;
		var yScale = this._yScale;
		var xIntercept = this._xIntercept;
		var yIntercept = this._yIntercept;

		var symbol = d3.svg.symbol().type(shape);



		if (rScale) {
			symbol = symbol.size(rScale);
		}

		return React.createElement(
			'div',
			null,
			React.createElement(
				Chart,
				{ height: height, width: width, margin: margin },
				React.createElement(Axis, _extends({
					className: 'x axis',
					orientation: 'bottom',
					scale: xScale,
					height: innerHeight,
					width: innerWidth,
					zero: yIntercept
				}, xAxis)),
				React.createElement(Axis, _extends({
					className: 'y axis',
					orientation: 'left',
					scale: yScale,
					height: innerHeight,
					width: innerWidth,
					zero: xIntercept
				}, yAxis)),
				React.createElement(DataSet, {
					ref: 'dataset',
					data: data,
					xScale: xScale,
					yScale: yScale,
					colorScale: colorScale,
					symbol: symbol,
					label: label,
					values: values,
					x: x,
					y: y,
					onMouseEnter: this.onMouseEnter,
					onMouseLeave: this.onMouseLeave,
					vizBounds: this.props.vizBounds,
					audBounds: this.props.audBounds,

				}),
				this.props.children
			),
			React.createElement(Tooltip, this.state.tooltip)
		);
	}
});

module.exports = ScatterPlot;