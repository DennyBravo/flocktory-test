define(['react'], function(React) {

	var CampaignList = React.createClass({
		render: function() {
			var self = this,
				createItem = function(item, index) {
					var alreadyAddedToComparator = self.props.compareItems.indexOf(item.id) > -1,
						comparatorLabel = alreadyAddedToComparator ? "remove from compare" : "add to compare",
						className = "campaigns-list-item" + (alreadyAddedToComparator ? " comparing" : "");

					return (
						<li className={className}>
							<span className="item-action">
								<a href="#" data-id={item.id} onClick={alreadyAddedToComparator ? self.props.removeFromComparator : self.props.addToComparator}>{comparatorLabel}</a>
							</span>
							<div className="metrics">
								<span className="metrics-item">m1:{item.metrics[0]}&nbsp;&nbsp;m2:{item.metrics[1]}</span>
								<span className="metrics-item">m3:{item.metrics[2]}&nbsp;&nbsp;m4:{item.metrics[3]}</span>
								<span className="metrics-item">m5:{item.metrics[4]}&nbsp;&nbsp;m6:{item.metrics[5]}</span>
							</div>
							<span className="item-name">{item.name}</span>
							<br/>
							<span className="item-id">{item.id}</span>
						</li>);
				};
			return (
				<ul className="campaigns-list">{this.props.items.map(createItem)}</ul>);
		}
	});

	var Controls = React.createClass({
		render: function() {
			return (
				<div className="paginator">
					<button disabled={this.props.current == 1} onClick={this.props.prev}>Prev</button>
					<span className="pageLabel">Page {this.props.current} from {this.props.count}</span>
					<button disabled={this.props.current == this.props.count} onClick={this.props.next}>Next</button>
					<span
						id="compareCallerLink"
						className={this.props.compareItemsLength >= 2 ? "activeLink" : ""}
						onClick={this.props.compareItemsLength >= 2 ? this.props.showComparator : ""}
					>compare {this.props.compareItemsLength} items</span>
				</div>);
		}
	});

	var Comparator = React.createClass({
		getInitialState: function() {
			return {
				visible: false,
				items: []
			};
		},
		componentWillReceiveProps: function(nextProps) {
			this.setState({
				items: nextProps.items,
				visible: nextProps.visible
			});
		},
		calculateSummary: function(){
			var summary = [0, 0, 0, 0, 0, 0];

			this.state.items.forEach(function(item){
				item.metrics.forEach(function(value, index){
					summary[index] += value;
				});
			});

			return summary;
		},
		render: function(){
			var options = {
					strokeWidth: 0.5,
					strokeColor: "#fff",
					textColor: "#000",
					fontSize: "14",
					graphBg: "rgba(30, 136, 0, 0.2)",
					layoutWidth: 400
				},
				summary = this.calculateSummary(),
				summaryRendered = [400, 400, 400, 400, 400, 400],
				labels = [4, 22, 42, 62, 82, 99],
				rate = 300 / (labels.length - 1),
				itemsCount = this.state.items.length;

			return (
				<div id="comparator" onClick={this.props.hideComparator} className={this.state.visible ? "active" : ""}>
					<svg width="500" height="300">
						<rect width="400" height="100%" fill="#eee" />

						{this.state.items.map(function(item, itemIndex){

							var points = "0,0";
							summaryRendered.forEach(function(value, index){
								points += " " + value + "," + (index * rate);
							});
							points += " 0,300"

							item.metrics.forEach(function(value, index){
								var wdt = Math.round(value / summary[index] * options.layoutWidth);
								summaryRendered[index] -= wdt;
							});

							return <polygon points={points} fill={options.graphBg}>
								<title>{item.name}</title>
							</polygon>;
						})}

						{labels.map(function(top, index){
							return (<g>
									<line x1="0" y1={rate * index} x2="100%" y2={rate * index} strokeWidth={options.strokeWidth} stroke={options.strokeColor} />
									<text x="406" y={top + "%"} fill={options.textColor} fontSize={options.fontSize}>{summary[index]}</text>
								</g>);
							})}
					</svg>
				</div>);
		}
	});

	var App = React.createClass({
		getInitialState: function() {
			return {
				items: [],
				compareItems: [],
				hashMap: {},
				offset: 0,
				limit: 10,
				isComparing: false,
				maxComparedItems: 8
			};
		},
		getJSONData: function(url){
			var self = this;
			var xhr = new XMLHttpRequest();
			xhr.open('get', url, true);
			xhr.responseType = 'json';
			xhr.onload = function() {
				var status = xhr.status;
				if (status == 200 && xhr.response["items"] !== undefined) {
					var items = xhr.response["items"],
						hashMap = {};

					items.forEach(function(item, index){
						hashMap[item.id] = index;
					});

					self.setState({
						items: items,
						hashMap: hashMap
					});

				} else {
					//on Failure
				}
			};
			xhr.send();
		},
		componentDidMount: function() {
			this.getJSONData("/js/data.json");
		},
		showPrevPage: function(){
			this.setState({
				offset: this.state.offset - this.state.limit
			});
		},
		showNextPage: function(){
			this.setState({
				offset: this.state.offset + this.state.limit
			});
		},
		addToComparator: function(e){
			var itemId = e.target.getAttribute("data-id");
			if (itemId !== undefined && this.state.compareItems.indexOf(itemId) == -1 && this.state.compareItems.length < this.state.maxComparedItems){
				var compareItems = this.state.compareItems;
				compareItems.push(itemId);
				this.setState({
					compareItems: compareItems
				});
			}else if(this.state.compareItems.length == this.state.maxComparedItems){
				alert("Max " + this.state.maxComparedItems + " items for compare");
			}
		},
		removeFromComparator: function(e){
			var itemId = e.target.getAttribute("data-id");
			if (itemId !== undefined && this.state.compareItems.indexOf(itemId) > -1){
				var compareItems = this.state.compareItems;
				compareItems.splice(compareItems.indexOf(itemId), 1);
				this.setState({
					compareItems: compareItems
				});
			}
		},
		toggleComparator: function(){
			this.setState({
				isComparing: !this.state.isComparing
			});
		},
		getComparedItems: function(){
			var comparedItems = [],
				items = this.state.items,
				hashMap = this.state.hashMap;

			this.state.compareItems.forEach(function(itemId, index){
				comparedItems.push(items[hashMap[itemId]]);
			});

			return comparedItems;
		},
		render: function(){
			return (
				<div id="app-container">
					<div className="campaigns">
						<CampaignList
							items={this.state.items.slice(this.state.offset, this.state.offset + this.state.limit)}
							compareItems={this.state.compareItems}
							addToComparator={this.addToComparator.bind(this)}
							removeFromComparator={this.removeFromComparator.bind(this)} />
						<Controls
							current={(this.state.offset+this.state.limit) / this.state.limit}
							count={this.state.items.length / this.state.limit }
							prev={this.showPrevPage.bind(this)}
							next={this.showNextPage.bind(this)}
							compareItemsLength={this.state.compareItems.length}
							showComparator={this.toggleComparator.bind(this)} />
					</div>
					<Comparator
						items={this.getComparedItems()}
						visible={this.state.isComparing}
						hideComparator={this.toggleComparator.bind(this)}/>
				</div>);
		}
	});

	return {
		App: App
	};
});