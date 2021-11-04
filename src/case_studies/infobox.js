add_infobox = function (svg) {

    let info_g_width = 300
    let info_g_height = 200

    let info_g = svg.append("g").attr("id", "info_g")
        .style("opacity", 0)

    info_g.append("rect").attr("height", info_g_height + "px").attr("width", info_g_width + "px").attr("x", 0).attr("y", 0).attr("fill", "#eee")
    
    let infotext = info_g.append("text")
        .text("UNDEFINED")
        .style("text-anchor", "start")
        .style("font-weight", "bold")
        .attr("x", 10)
        .attr("y", 20)

    let infotextgroup = info_g.append("text")
        .text("UNDEFINED")
        .style("text-anchor", "start")
        .attr("x", 27)
        .attr("y", 40)

    let infocirclegroup = info_g.append("circle")
        .attr("cx", 17)
        .attr("cy", 36)
        .attr("r", 5)
        .attr("fill", "red")

    let chart_padding = {top: 60, bottom: 30, left: 30, right: 30}

    let maxcollabs = Math.max.apply(0, Object.values(groupworks).map(el => Object.values(el).map(e => e.total_collabs).reduce((a, b) => a + b)))
    maxcollabs = maxcollabs/2

    // AXES
    const bar_x = d3.scaleLinear()
        .domain([yearsVisualized[0], yearsVisualized[1]])
        .range([0, info_g_width - chart_padding.left - chart_padding.right]);

    const bar_y = d3.scaleLinear()
        .domain([0, maxcollabs])
        .range([info_g_height - chart_padding.top - chart_padding.bottom, 0])

    info_g.append('g')
        .attr("transform", "translate(" + chart_padding.left + "," + (info_g_height - chart_padding.bottom) + ")")
        .call(d3.axisBottom(bar_x))

    info_g.append('g')
        .attr("transform", "translate(" + chart_padding.left + "," + (chart_padding.top) + ")")
        .call(d3.axisLeft(bar_y))
    // END AXES

    // let infopath1 = info_g.append("path")
    //     .attr("stroke-width", 2)
    //     .attr("stroke", "gray")
    //     .attr("fill", "none")
    //     .attr("d", () => {return d3.line()([[-20, -100], [20, -100], [20, 0]])})

    svg.selectAll(".node")
        .on("mouseover", (d) => {

            info_g.selectAll(".infogrect").remove()

            info_g.style("opacity", 1)

            d3.selectAll(".node").style("opacity", 0.2)
            d3.selectAll(".edgepath").style("opacity", 0.2)
            d3.selectAll(".node-" + d3.select(d.target).datum().name.replace(" ", "")).style("opacity", 1)
            d3.selectAll(".edgepath-" + d3.select(d.target).datum().name.replace(" ", "")).style("opacity", 1)

            let da = d3.select(d.target).datum()
            
            let x = 50 + d.clientX - svg.node().getBoundingClientRect().x
            let y = 150 + d.clientY - svg.node().getBoundingClientRect().y
            
            infotext.html(da.name)
            infotextgroup.html(da.theme)

            // console.log(groupworks[da.name + "(" + da.gcode + ")"])
            let works = groupworks[da.name + "(" + da.gcode + ")"]
            for (let year in works){
                let sum_of_prev_theme_height = 0;
                for (let theme of themes){
                    if (works[year].by_theme[theme] == undefined) continue;
                    console.log(da.name, year, theme, works[year]["by_theme"][theme])
                    info_g.append("rect")
                        .attr("class", "infogrect")
                        .attr("height", info_g_height - chart_padding.top - chart_padding.bottom - bar_y(works[year]["by_theme"][theme]))
                        .attr("x", bar_x(year) + chart_padding.left)
                        .attr("y", chart_padding.top + bar_y(works[year]["by_theme"][theme]) - sum_of_prev_theme_height)
                        .attr("width", bar_x(yearsVisualized[0] + 1))
                        .attr("fill", themecolordict[theme])

                        // sum_of_prev_theme_height += 100
                        sum_of_prev_theme_height += info_g_height - chart_padding.top - chart_padding.bottom - bar_y(works[year]["by_theme"][theme]);
                }
            }

            infocirclegroup.attr("fill", themecolordict[d3.select(d.target).datum().theme])

            info_g.attr("transform", "translate(" + x + "," + y + ")")
        })
        .on("mouseout", (d) => {
            d3.selectAll(".node").style("opacity", 1)
            d3.selectAll(".edgepath").style("opacity", 1)
        })
}