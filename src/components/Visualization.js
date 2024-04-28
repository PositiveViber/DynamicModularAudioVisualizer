import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';

const Visualization = ({ fftData }) => {
    const svgRef = useRef(null);
    const svgWidth = 800;
    const svgHeight = 400;

    
    useEffect(() => {
        if (!fftData || !fftData.xf || !fftData.yf) {
            console.warn('fftData is not structured properly:', fftData);
            return; // Exit if the data isn't structured properly
        }

        // Assuming you want the SVG to take up the full dimensions given to it:

        const margin = { top: 20, right: 20, bottom: 30, left: 40 };
        const width = svgWidth - margin.left - margin.right;
        const height = svgHeight - margin.top - margin.bottom;

        // Select the SVG element by the ref and clear it for new drawing
        const svg = d3.select(svgRef.current);
        svg.selectAll('*').remove();

        // Define scales
        const xScale = d3.scaleLinear()
            .domain(d3.extent(fftData.xf)) // Assuming xf is already sorted
            .range([0, width]);

        const yScale = d3.scaleLinear()
            .domain([0, d3.max(fftData.yf)])
            .range([height, 0]);

        // Define the line generator
        const line = d3.line()
            .x((_, i) => xScale(fftData.xf[i]))
            .y(y => yScale(y))
            .curve(d3.curveNatural);

        // Draw the path using the line generator
        svg.append('path')
            .datum(fftData.yf) // Bind the yf data as the data for the path
            .attr('fill', 'none')
            .attr('stroke', 'steelblue')
            .attr('stroke-width', 2)
            .attr('d', line)
            .attr('transform', `translate(${margin.left},${margin.top})`);

    }, [fftData]); // Rerender the effect if fftData changes

    return (
        <svg ref={svgRef} width={svgWidth} height={svgHeight} />
    );
};

export default Visualization;
