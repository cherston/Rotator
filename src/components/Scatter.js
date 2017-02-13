import React, { Component } from 'react';
import ResizableAndMovable from 'react-resizable-and-movable';
import Store from '../Store';
import ReactD3 from 'react-d3-components';
var ScatterPlot = ReactD3.ScatterPlot;
var head = require('./backofhead.png');

export default class Scatter extends Component {

  constructor(props) {
	super(props)
	};

  getMode(x,y){
    return this.refs.scatterplot.getMode(x,y);
  }
  getInViz(){
    return this.refs.scatterplot.getModes();
  };

  render() {
    const { Streams, findPlotIndex } = this.props;
  	var data =
    {
      label: 'sensorLocations',
          values: [
            {x:0,y:0,ref:null, cluster:null, clustermates: [], stream:null, selected: false}
          ]
    }
    //console.log('cluster: ' + Streams.getIn([0,'cluster']));
    const clusternum = Store.getClustNum;



    const values = Streams.map(
      function (stream) {
             const clusterinfo = Store.getClustNum().filter(function(x){return x.val === stream.get('cluster')})[0];
              var clustermates = null;
              if(clusterinfo)
                clustermates = clusterinfo.contents

            data.values.push({
            x:stream.get('Coords').get('x'),
            y:stream.get('Coords').get('y'),
            ref:findPlotIndex(stream.get('ID')),
            cluster:stream.get('cluster'),
            clustermates: clustermates,
            selected:stream.get('selected'),
        })}
    );


  var tooltipScatter = function(x, y) {
        return 'x: ' + x + ' y: ' + y;
    };
  	return(
  		<div>
  		<ScatterPlot
            ref={'scatterplot'}
	          data={data}
            width={400}
            height={this.props.height}
            margin={{top: 10, bottom: 50, left: 50, right: 10}}
            tooltipHtml={tooltipScatter}
            xAxis={{innerTickSize: 6, label: 'x'}}
            yAxis={{label: 'y'}}
            audBounds={this.props.audioBounds}
            vizBounds={this.props.visualBounds}
            clustnum={Store.getClustNum()}

           />
  		</div>

  	)
  }
}
