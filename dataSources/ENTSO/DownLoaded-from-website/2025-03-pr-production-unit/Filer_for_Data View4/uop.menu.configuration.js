var domainsToMenu = {
	'load-nav': {
		dataViews: '#load-domain-dataviews'
	},
	'generation-nav': {
		dataViews: '#generation-domain-dataviews'
	},
	'transmission-nav': {
		dataViews: '#transmission-domain-dataviews'
	},
	'balancing-nav': {
		dataViews: '#balancing-domain-dataviews'
	},
	'outages-nav': {
		dataViews: '#outages-domain-dataviews'
	},
	'congestion-management-nav': {
		dataViews: '#congestion-domain-dataviews'
	},
	'system-operations-nav': {
		dataViews: '#system-domain-dataviews'
	},
	'cacm-nav': {
		dataViews: '#cacm-domain-dataviews'
	}
};

var dataViewsToDomain = {
	"Total Load - Day Ahead / Actual": "load-nav",
	"Total Load Forecast - Week Ahead": "load-nav",
	"Total Load Forecast - Month Ahead": "load-nav",
	"Total Load Forecast - Year Ahead": "load-nav",
	"Year-ahead Forecast Margin": "load-nav",

	"Installed Capacity per Production Type": "generation-nav",
	"Water Reservoirs and Hydro Storage Plants": "generation-nav",
	"Actual Generation per Production Type": "generation-nav",
	"Actual Generation per Generation Unit": "generation-nav",
	"Generation Forecast - Day ahead": "generation-nav",
	"Generation Forecasts for Wind and Solar": "generation-nav",
	"Installed Capacity Per Production Unit": "generation-nav",

	"Scheduled Commercial Exchanges": "transmission-nav",
	"Cross Border Physical Flows": "transmission-nav",
	"Day-ahead Prices": "transmission-nav",
	"Forecasted Transfer Capacities - Day Ahead": "transmission-nav",
	"Forecasted Transfer Capacities - Week Ahead": "transmission-nav",
	"Forecasted Transfer Capacities - Month Ahead": "transmission-nav",
	"Forecasted Transfer Capacities - Year Ahead": "transmission-nav",
	"Explicit Allocations - Intraday": "transmission-nav",
	"Explicit Allocations - Day Ahead": "transmission-nav",
	"Explicit Allocations - Long term / Medium term": "transmission-nav",
	"Explicit Allocations Revenue": "transmission-nav",
	"Explicit Allocations - AAC": "transmission-nav",
	"Transfer Capacities Allocated with Third Countries": "transmission-nav",
	"Transfer Capacities Allocated with Third Countries (Implicit)": "transmission-nav",
	"Total Nominated Capacity": "transmission-nav",
	"Implicit Allocations - Intraday": "transmission-nav",
	"Implicit Allocations - Day Ahead": "transmission-nav",
	"Intraday Implicit Allocations - Congestion Income": "transmission-nav",
	"Daily Implicit Allocations - Congestion Income": "transmission-nav",
	"Cross Border Capacity of DC Links - Ramping Restrictions": "transmission-nav",
	"Cross Border Capacity of DC Links - Intraday Transfer Limits": "transmission-nav",
	"Expansion And Dismantling Projects": "transmission-nav",
	"Expansion And Dismantling Projects (Binary)": "transmission-nav",
	"Critical Network Elements": "transmission-nav",
	"Day Ahead Flow Based Allocations": "transmission-nav",
	//Commented due to TPM-1239
	//"Intraday Flow Based Allocations": "transmission-nav",
	"Daily Flow Based Allocations - Congestion Income": "transmission-nav",
    //Commented due to TPM-1447
	//"Intraday Flow Based Allocations - Congestion Income": "transmission-nav",

	"Accepted Offers and Activated Balancing Reserves": "balancing-nav",
	"Aggregated Bids": "balancing-nav",
	"Algorithm": "balancing-nav",
	"Approved Methodologies": "balancing-nav",
	"Balancing energy bids": "balancing-nav",
	"CBMPs for aFRR CS": "balancing-nav",
	"Common Annual Report": "balancing-nav",
	"Cross-Border Balancing": "balancing-nav",
	"Current Balancing State": "balancing-nav",
	"Exchanged reserve capacity": "balancing-nav",
	"Exchanged Reserve Capacity": "balancing-nav",
	"FCR Shares of capacity": "balancing-nav",
	"FCR Total Capacity": "balancing-nav",
	"FRR actual capacity": "balancing-nav",
	"FRR forecast": "balancing-nav",
	"Financial Expenses and Income": "balancing-nav",
	"Imbalance": "balancing-nav",
	"Imbalance Netting": "balancing-nav",
	"Information on Conversion into Standard Products": "balancing-nav",
	"Prices of Activated Balancing Energy": "balancing-nav",
	"Price of Reserved Balancing Reserves": "balancing-nav",
	"Procured Capacity": "balancing-nav",
	"RR actual capacity": "balancing-nav",
	"RR forecast": "balancing-nav",
	"Rules on Balancing": "balancing-nav",
	"Sharing FCR": "balancing-nav",
	"Sharing of reserve capacity": "balancing-nav",
	"Terms and Conditions": "balancing-nav",
	"Use of allocated cross-zonal balancing capacity": "balancing-nav",
	"Volumes of Contracted Balancing Reserves": "balancing-nav",

	"Unavailability in Transmission Grid": "outages-nav",
	"Unavailability of Offshore Grid": "outages-nav",
	"Unavailability of Production and Generation Units": "outages-nav",
	"Aggregated Unavailability of Consumption Units": "outages-nav",

	"Countertrading": "congestion-management-nav",
	"Redispatching - Cross Border": "congestion-management-nav",
	"Cost of Congestion Management": "congestion-management-nav",
	"Redispatching - Internal": "congestion-management-nav",

    "LFC Block Agreements": "system-operations-nav",
    "Measurements of frequency quality": "system-operations-nav",
    "Synchronous Area Agreements": "system-operations-nav",

	"Curtailment": "cacm-nav",
	"Interconnector Losses": "cacm-nav",
	"Flow-based capacity allocation and network utilisation": "cacm-nav",
	"NTC-based capacity allocation and network utilisation": "cacm-nav"

};

var flowBasedTransmissionDVDefinition = [
	"Day Ahead Flow Based Allocations"
	//"Intraday Flow Based Allocations"
];

var flowBasedTransmissionDV = flowBasedTransmissionDVDefinition.join("|");
