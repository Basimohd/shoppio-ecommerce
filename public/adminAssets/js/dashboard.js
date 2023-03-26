(function ($) {
  'use strict';
  $(function () {
    fetch('/admin/graphDetails')
      .then(response => response.json())
      .then(data => {
        if ($("#order-chart").length) {
          var areaData = {
            labels: data.label,
            datasets: [
              {
                label: "Men",
                data: data.maleOrders,
                borderColor: '#4747A1',
                borderWidth: 2,
                fill: false,
              },
              {
                label: "Women",
                data: data.femaleOrders,
                borderColor: '#F09397',
                borderWidth: 2,
                fill: false,
              }
            ]
          };
          var areaOptions = {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
              filler: {
                propagate: false
              }
            },
            scales: {
              xAxes: [{
                display: true,
                ticks: {
                  display: true,
                  padding: 10,
                  fontColor: "#6C7383"
                },
                gridLines: {
                  display: false,
                  drawBorder: false,
                  color: 'transparent',
                  zeroLineColor: '#eeeeee'
                }
              }],
              yAxes: [{
                display: true,
                ticks: {
                  display: true,
                  autoSkip: false,
                  maxRotation: 0,
                  stepSize: 2,
                  min: 0,
                  max: 10,
                  padding: 18,
                  fontColor: "#6C7383"
                },
                gridLines: {
                  display: true,
                  color: "#f2f2f2",
                  drawBorder: false
                }
              }]
            },

            legend: {
              display: false,
             
            },
            tooltips: {
              enabled: true,
              mode: 'index', // set mode to 'index' to show a legend when hovering over the chart line
              intersect: false,
              callbacks: {
                label: function(tooltipItem, data) {
                  var label = data.datasets[tooltipItem.datasetIndex].label || '';
          
                  if (label) {
                    label += ': ';
                  }
                  label += tooltipItem.yLabel;
                  return label;
                }
              }
            },
            elements: {
              line: {
                tension: .35
              },
              point: {
                radius: 0
              }
            }
          };
          var revenueChartCanvas = $("#order-chart").get(0).getContext("2d");
          var revenueChart = new Chart(revenueChartCanvas, {
            type: 'line',
            data: areaData,
            options: areaOptions
          });

        }
      
    if ($("#sales-chart").length) {
      var SalesChartCanvas = $("#sales-chart").get(0).getContext("2d");
      var SalesChart = new Chart(SalesChartCanvas, {
        type: 'bar',
        data: {
          labels: data.userLabel,
          datasets: [
            {
              label: 'Users',
              data: data.users,
              backgroundColor: '#98BDFF'
            }
          ]
        },
        options: {
          cornerRadius: 5,
          responsive: true,
          maintainAspectRatio: true,
          layout: {
            padding: {
              left: 0,
              right: 0,
              top: 20,
              bottom: 0
            }
          },
          scales: {
            yAxes: [{
              display: true,
              gridLines: {
                display: true,
                drawBorder: false,
                color: "#F2F2F2"
              },
              ticks: {
                display: true,
                min: 0,
                max: 10,
                callback: function (value, index, values) {
                  return value;
                },
                autoSkip: true,
                maxTicksLimit: 10,
                fontColor: "#6C7383"
              }
            }],
            xAxes: [{
              stacked: false,
              ticks: {
                beginAtZero: true,
                fontColor: "#6C7383"
              },
              gridLines: {
                color: "rgba(0, 0, 0, 0)",
                display: false
              },
              barPercentage: 1
            }]
          },
          legend: {
            display: false
          },
          elements: {
            point: {
              radius: 0
            }
          }
        },
      });
      document.getElementById('sales-legend').innerHTML = SalesChart.generateLegend();
    }
  
    if ($("#north-america-chart").length) {
      var areaData = {
        labels: ["COD", "Online Payment", "Return"],
        datasets: [{
          data: [data.paymentData.COD, data.paymentData.online,data.paymentData.return],
          backgroundColor: [
            "#4B49AC", "#FFC100", "#248AFD",
          ],
          borderColor: "rgba(0,0,0,0)"
        }
        ]
      };
      var areaOptions = {
        responsive: true,
        maintainAspectRatio: true,
        segmentShowStroke: false,
        cutoutPercentage: 78,
        elements: {
          arc: {
            borderWidth: 4
          }
        },
        legend: {
          display: false
        },
        tooltips: {
          enabled: true
        },
        legendCallback: function (chart) {
          var text = [];
          text.push('<div class="report-chart">');
          text.push('<div class="d-flex justify-content-between mx-4 mx-xl-5 mt-3"><div class="d-flex align-items-center"><div class="mr-3" style="width:20px; height:20px; border-radius: 50%; background-color: ' + chart.data.datasets[0].backgroundColor[0] + '"></div><p class="mb-0">Cash On Delivery</p></div>');
          text.push(`<p class="mb-0 text-success">+₹${data.paymentRevenue.CODRevenue}</p>`);
          text.push('</div>');
          text.push('<div class="d-flex justify-content-between mx-4 mx-xl-5 mt-3"><div class="d-flex align-items-center"><div class="mr-3" style="width:20px; height:20px; border-radius: 50%; background-color: ' + chart.data.datasets[0].backgroundColor[1] + '"></div><p class="mb-0">Online Payment</p></div>');
          text.push(`<p class="mb-0 text-success">+₹${data.paymentRevenue.onlineRevenue}</p>`);
          text.push('</div>');
          text.push('<div class="d-flex justify-content-between mx-4 mx-xl-5 mt-3"><div class="d-flex align-items-center"><div class="mr-3" style="width:20px; height:20px; border-radius: 50%; background-color: ' + chart.data.datasets[0].backgroundColor[2] + '"></div><p class="mb-0">Returns</p></div>');
          text.push(`<p class="mb-0 text-danger">₹${data.paymentRevenue.Refunded}</p>`);
          text.push('</div>');
          text.push('</div>');
          return text.join("");
        },
      }
      var northAmericaChartPlugins = {
        beforeDraw: function (chart) {
          var width = chart.chart.width,
            height = chart.chart.height,
            ctx = chart.chart.ctx;

          ctx.restore();
          var fontSize = 3.125;
          ctx.font = "500 " + fontSize + "em sans-serif";
          ctx.textBaseline = "middle";
          ctx.fillStyle = "#13381B";

          var text = data.payments,
            textX = Math.round((width - ctx.measureText(text).width) / 2),
            textY = height / 2;

          ctx.fillText(text, textX, textY);
          ctx.save();
        }
      }
      var northAmericaChartCanvas = $("#north-america-chart").get(0).getContext("2d");
      var northAmericaChart = new Chart(northAmericaChartCanvas, {
        type: 'doughnut',
        data: areaData,
        options: areaOptions,
        plugins: northAmericaChartPlugins
      });
      document.getElementById('north-america-legend').innerHTML = northAmericaChart.generateLegend();
    }
  })

  });
})(jQuery);