function ethPrice() {
	$('#eth_loaded').val(1);
		
	return $.get({	url:	"https://api.binance.com/api/v3/ticker/price", data: 	{ symbol: "ETHUSDC" },
				success: function(data) { $('#eth_price').val(data.price); } });
	
}



function searchMarket() {
	$("#inputSearchMarket").on("keyup", function() {
    	var value = $(this).val().toLowerCase();
    	$("#listMarket tr").filter(function() {
      		$(this).toggle($(this).text().toLowerCase().indexOf(value) > -1)
    	});
	});
}


var all_pairs_loaded = [];



function load_martket0() {
		// Price ETH or FTM
		var eth_price 	= $('#eth_price').val();
		
		// chainID for API
		var chain_ID	= $('#chainID').val();
		
		// Loading data ( symbol/derivedETH/liquidity....)
		loadDataPair($('#selectedPair').val());
		
		// Search
		var search		= $('#inputSearchMarket').val().length;
		
		if(search == 0) {
		$.get({
  		url: "https://api2.sushipro.io/",
  		data: {	chainID: chain_ID,	action:"all_pairs" },
		success: function( result ) {
			var start 		= 1;
			var addClass 	= "";
			var pairs		= [];
			
			
			
			
			result[1].forEach( function(pair) {
				if(all_pairs_loaded.indexOf(pair.Pair_ID) >= 0) { } else { all_pairs_loaded.push(pair); }
				var total_reserve	=	(pair.Token_1_reserve*pair.Token_1_derivedETH) + (pair.Token_2_reserve*pair.Token_2_derivedETH);
				var name			=	pair.Token_1_symbol.substr(0,10) + " / <span style='opacity:0.7;font-size:10px;'>" + pair.Token_2_symbol.substr(0,10)+'</span>';
				var fullname		=	pair.Token_1_symbol+";"+pair.Token_2_symbol;
				pairs.push([pair.Pair_ID,total_reserve,name,pair.Token_1_price,pair.Token_1_derivedETH*eth_price,fullname,pair.Token_1_derivedETH])
			});
			
			pairs.sort(function(a,b){return b[1] - a[1] });
			
			$('#listMarket').html('');
			pairs.forEach( function(pair) {
				if(start == 1) { start = 0; addClass = ""; } else { start = 1; addClass = "ml2"; }
    			$( "#listMarket" ).append( "<tr class='marketList "+addClass+"' onClick='fullLoadPair(\""+pair[0]+"\");' > <td style='border-left:3px solid #5ab1e6;padding-left:5px;'><div style='position:absolute;right:3px;font-size:10px;opacity:0.5;margin-top:2px;' class='devETH' derivedETH='"+pair[6]+"'>$"+new Intl.NumberFormat('en-US').format(pair[4])+"</div> <span style='display:none;'>"+pair[5]+"</span> " + pair[2] + "</td></tr>" );
    		});
		}
		});
		
		searchMarket();
		
		} else { }
}


function load_market() {
	$('#listMarket').append('<tr><td style="height:100px;text-align:center;"><i style="color:#5ab1e6;" class="far fa-sync-alt fa-spin"></i><br/><span style="color:#5ab1e6;font-size:10px;">loading data...</span></tr></td>');
	var load 	=	$('#eth_loaded').val();
	if(load	== 0) {
		ethPrice().then( function() {
			load_martket0();
		});
	} else {
		load_martket0();
	}
}


function loadTradePair(pairID,mode) {
	var thePair		= pairID;
	var inputPair	= $('#selectedPair').val(''+thePair+'');
	var chain_ID	= $('#chainID').val();
	$('#lastTradePair').html('');
	$('#lastTradePair').append('<tr><td style="height:100px;text-align:center;" colspan="6"><i style="color:#5ab1e6;" class="far fa-sync-alt fa-spin"></i><br/><span style="color:#5ab1e6;font-size:10px;">loading data...</span></tr></td>');
	
	$.get({
  		url: "https://api2.sushipro.io/",
  		data: {	chainID: chain_ID,	action:"get_transactions_by_pair", pair: thePair },
		success: function( result ) {
			$('#lastTradePair').html('<tr> <td style="text-align:left;font-size:10px;">Time</td> <td style="text-align:left;font-size:10px;">Base price </td> <td style="text-align:left;font-size:10px;">Quote price </td> <td style="text-align:left;font-size:10px;">Amount</td> <td style="text-align:left;font-size:10px;">Volume</td> </tr>');
			result[1].forEach( function(pair) {
				if(pair.side == "SELL") { color = "#bf7474"; } else { color = "#26a69a"; }
				
				if(mode == "USD") {
					var priceBase	=	"$"+new Intl.NumberFormat('en-US').format(pair.priceUSD.toFixed(4));
					var priceQuote	= 	"$"+new Intl.NumberFormat('en-US').format((pair.volumeUSD/pair.amountQuote).toFixed(4));
				} else {
					var priceBase	=	new Intl.NumberFormat('en-US').format(pair.priceBase.toFixed(4));
					var priceQuote	= 	new Intl.NumberFormat('en-US').format((1/pair.priceBase).toFixed(4));
				}
				var timestamp	=	timeToDate(pair.timestamp);
				$('#lastTradePair').append("<tr  style='color:"+color+";font-size:10px;'><td style='text-align:left;'>"+timestamp+"</td><td style='text-align:left;'>"+priceBase+"</td><td style='text-align:left;'>"+priceQuote+"</td><td style='text-align:left;'>"+pair.amountBase.toFixed(4)+"</td><td style='text-align:left;'>$"+new Intl.NumberFormat('en-US').format(pair.volumeUSD.toFixed(4))+"</td></tr>");
			});
		
		}
	});
}



async function loadOrderHistory(mode) {

	var isConnected	=	$('#isWalletConnected').val();
	var chain_ID	= 	$('#chainID').val();
	
	
	if(isConnected == 1) {
		var the_accounts 	= await ethereum.request({ method: 'eth_requestAccounts'});
    	var the_account		= the_accounts[0];
    	
    	$('#lastOrderHistory').html('');
		$('#lastOrderHistory').append('<tr><td style="height:100px;text-align:center;" colspan="6"><i style="color:#5ab1e6;" class="far fa-sync-alt fa-spin"></i><br/><span style="color:#5ab1e6;font-size:10px;">loading data...</span></tr></td>');
		
		$.get({
  		url: "https://api2.sushipro.io/",
  		data: {	chainID: chain_ID,	action:"get_transactions_by_user", address: the_account },
		success: function(result) {
			$('#lastOrderHistory').html('<tr> <td style="text-align:left;font-size:10px;">Date</td> <td style="text-align:left;font-size:10px;">Side</td> <td style="text-align:left;font-size:10px;">Pair</td> <td style="text-align:left;font-size:10px;">Amount</td> <td style="text-align:left;font-size:10px;">Price</td> <td style="text-align:left;font-size:10px;">Volume</td> </tr>');
			
			var numberResult	=	result[0].number_of_results;
			if(numberResult > 0) {
			
				result[1].forEach( function(pair) {
					if(pair.side == "SELL") { color = "#bf7474"; } else { color = "#26a69a"; }
					if(mode == "USD") {
						var priceBase	=	"$"+new Intl.NumberFormat('en-US').format(pair.priceUSD.toFixed(4));
						var priceQuote	= 	"$"+new Intl.NumberFormat('en-US').format((pair.volumeUSD/pair.amountQuote).toFixed(4));
					} else {
						var priceBase	=	new Intl.NumberFormat('en-US').format(pair.priceBase.toFixed(4));
						var priceQuote	= 	new Intl.NumberFormat('en-US').format((1/pair.priceBase).toFixed(4));
					}
					
					var pairName = pair.pairID.substr(0,12)+"...";
					
					all_pairs_loaded.forEach( function(data) { 
						
						if(data.Pair_ID == pair.pairID) { 
							pairName = data.Token_1_symbol+" / "+data.Token_2_symbol;
						} else { }
					});

					var timestamp	=	fulltimeToDate(pair.timestamp);
					$('#lastOrderHistory').append("<tr  style='color:"+color+";font-size:10px;'><td style='text-align:left;'>"+timestamp+"</td><td style='text-align:left;'>"+pair.side+"</td><td style='text-align:left;'>"+pairName+"</td><td style='text-align:left;'>"+pair.amountBase+"</td><td style='text-align:left;'>"+priceBase+"</td><td style='text-align:left;'>$"+new Intl.NumberFormat('en-US').format(pair.volumeUSD.toFixed(4))+"</td></tr>");
				});
			
			
			} else {
				$('#lastOrderHistory').html('');
				$('#lastOrderHistory').append('<tr><td style="height:100px;text-align:center;" colspan="6"><i class="fal fa-exclamation-triangle blue"></i><br/><span style="color:#5ab1e6;font-size:10px;">It seems you didn\'t trade on this chain. <br/>What are you waiting for ?</span></tr></td>');
			}
		}
		});
	
	
    } else { 
    	$('#lastOrderHistory').html('');
		$('#lastOrderHistory').append('<tr><td style="height:100px;text-align:center;" colspan="6"><i class="fal fa-exclamation-triangle blue"></i><br/><span style="color:#5ab1e6;font-size:10px;">It seems that you are not connected.</span></tr></td>');
	
    }

	
	
}


function loadTradeByToken(tokenID,mode) {
	var theToken	= tokenID;
	var chain_ID	= $('#chainID').val();
	$('#lastTradeByToken').html('');
	$('#lastTradeByToken').append('<tr><td style="height:100px;text-align:center;" colspan="6"><i style="color:#5ab1e6;" class="far fa-sync-alt fa-spin"></i><br/><span style="color:#5ab1e6;font-size:10px;">loading data...</span></tr></td>');
	$('#lastTradeByToken').show();
	
	$.get({
  		url: "https://api2.sushipro.io/",
  		data: {	chainID: chain_ID,	action:"get_transactions_by_token", token: theToken },
		success: function( result ) {
			$('#lastTradeByToken').html('<tr> <td style="text-align:left;font-size:10px;">Time</td> <td style="text-align:left;font-size:10px;">Base price </td> <td style="text-align:left;font-size:10px;">Quote price </td> <td style="text-align:left;font-size:10px;">Amount</td> <td style="text-align:left;font-size:10px;">Volume</td> </tr>');
			result[1].forEach( function(pair) {
				if(pair.side == "SELL") { color = "#bf7474"; } else { color = "#26a69a"; }
				
				if(mode == "USD") {
					var priceBase	=	"$"+new Intl.NumberFormat('en-US').format(pair.priceUSD.toFixed(4));
					var priceQuote	= 	"$"+new Intl.NumberFormat('en-US').format((pair.volumeUSD/pair.amountQuote).toFixed(4));
				} else {
					var priceBase	=	new Intl.NumberFormat('en-US').format(pair.priceBase.toFixed(4));
					var priceQuote	= 	new Intl.NumberFormat('en-US').format((1/pair.priceBase).toFixed(4));
				}
				var timestamp	=	timeToDate(pair.timestamp);
				$('#lastTradeByToken').append("<tr  style='color:"+color+";font-size:10px;'><td style='text-align:left;'>"+timestamp+"</td><td style='text-align:left;'>"+priceBase+"</td><td style='text-align:left;'>"+priceQuote+"</td><td style='text-align:left;'>"+pair.amountBase.toFixed(4)+"</td><td style='text-align:left;'>$"+new Intl.NumberFormat('en-US').format(pair.volumeUSD.toFixed(4))+"</td></tr>");
			});
		
		}
	});
}


function timeToDate(timestamp) {
	let unix_timestamp = timestamp
	var date = new Date(unix_timestamp * 1000);
	var hours = date.getHours();
	var minutes = "0" + date.getMinutes();
	var seconds = "0" + date.getSeconds();
	var formattedTime = hours + ':' + minutes.substr(-2) + ':' + seconds.substr(-2);
	
	var options = {day: "2-digit", month: "2-digit", year: "2-digit", hour: "2-digit", minute:"2-digit"};
	var formattedTime = date.toLocaleString("en-GB", options);
	return formattedTime;
}

function fulltimeToDate(timestamp) {
	let unix_timestamp = timestamp
	var date = new Date(unix_timestamp * 1000);
	var hours = date.getHours();
	var minutes = "0" + date.getMinutes();
	var seconds = "0" + date.getSeconds();
	var options = {day: "2-digit", month: "2-digit", year: "2-digit", hour: "2-digit", minute:"2-digit"};
	var formattedTime = date.toLocaleString("en-GB", options);
	return formattedTime;
}

async function loadDataPair(pairID) {
	var thePair		= pairID;
	var chain_ID	= $('#chainID').val();
	var eth_price 	= $('#eth_price').val();
	$.get({
  		url: "https://api2.sushipro.io/",
  		data: {	chainID: chain_ID,	action:"get_pair", pair: thePair },
		success: async function(resultat) {
			
			var result 		= 	resultat[0];
			
			var liquidityE	=	((result.Token_1_reserve*result.Token_1_derivedETH)+(result.Token_2_reserve*result.Token_2_derivedETH));
			var liquidity	=	((result.Token_1_reserve*result.Token_1_derivedETH)+(result.Token_2_reserve*result.Token_2_derivedETH))*eth_price;
			var priceBase	=	result.Token_1_derivedETH*eth_price;
			var priceQuote	=	result.Token_2_derivedETH*eth_price;
			$('#baseToken').val(result.Token_1_contract);
			$('#quoteToken').val(result.Token_2_contract);
			$('#baseReserve').val(result.Token_1_reserve);
			$('#quoteReserve').val(result.Token_2_reserve);
			$('#baseDecimals').val(result.Token_1_decimals);
			$('#quoteDecimals').val(result.Token_2_decimals);
			$('#topPairSymbol').html("<b>"+result.Token_1_symbol+" / "+result.Token_2_symbol+"</b>");
			$('#topPairName').html(result.Token_1_name+" / "+result.Token_2_name);
			$('#marketBuyBase').html(result.Token_2_symbol.substr(0,6));
			$('#marketBuyQuote').html(result.Token_1_symbol.substr(0,6));
			$('#marketSellBase').html(result.Token_1_symbol.substr(0,6));
			$('#marketSellQuote').html(result.Token_2_symbol.substr(0,6));
			$('#topPrice').html(result.Token_1_price.toFixed(6)+" / "+result.Token_2_price.toFixed(6));
			$('#topChainName').html($('#chainName').val());
			$('#topLiquidity').html('$<span class="topETH" derivedETH="'+liquidityE+'">'+new Intl.NumberFormat('en-US').format(liquidity)+'</span>');
			$('#topUSDPrice').html('$<span class="topETH" derivedETH="'+result.Token_1_derivedETH+'">'+new Intl.NumberFormat('en-US').format(priceBase)+'</span> / $<span class="topETH" derivedETH="'+result.Token_2_derivedETH+'">'+new Intl.NumberFormat('en-US').format(priceQuote)+'</span>');
			
			$('#baseTokenAllowance').val(0);
			$('#quoteTokenAllowance').val(0);
			var is_connected	=	$('#isWalletConnected').val();
			if(is_connected == 1) {
				// Balance
				try {
					var the_router	=	$('#currentRouter').val();
					the_accounts 	= await ethereum.request({ method: 'eth_requestAccounts'});
    				the_account		= the_accounts[0];
					
					var baseBalance		=	await getBalance(result.Token_1_contract,the_account);
					var quoteBalance	=	await getBalance(result.Token_2_contract,the_account);
					$('#balanceBaseToken').val(baseBalance/Math.pow(10,result.Token_1_decimals));
					$('#balanceQuoteToken').val(quoteBalance/Math.pow(10,result.Token_2_decimals));
					
					// Allowance
					var allowBase	=	await checkAllowance(the_account,result.Token_1_contract,the_router);
					var allowQuote	=	await checkAllowance(the_account,result.Token_2_contract,the_router);
					$('#baseTokenAllowance').val(allowBase);
					$('#quoteTokenAllowance').val(allowQuote);
					
					if(allowBase == 0) { $('#buttonMarketSell').html('APPROVE BEFORE SELL'); } else { $('#buttonMarketSell').html('SELL'); }
					if(allowQuote == 0) { $('#buttonMarketBuy').html('APPROVE BEFORE BUY'); } else { $('#buttonMarketBuy').html('BUY'); }
					
				} catch {
					// $('#balanceBaseToken').val(0);
					// $('#balanceQuoteToken').val(0);
					// $('#baseTokenAllowance').val(0);
					// $('#quoteTokenAllowance').val(0);
				}
				
			} else { }
		}
	});
}

async function refreshBalance() {

	the_accounts 	= await ethereum.request({ method: 'eth_requestAccounts'});
    the_account		= the_accounts[0];
					
	var baseBalance		=	await getBalance($('#baseToken').val(),the_account);
	var quoteBalance	=	await getBalance($('#quoteToken').val(),the_account);
	$('#balanceBaseToken').val(baseBalance/Math.pow(10,Number($('#baseDecimals').val()) ));
	$('#balanceQuoteToken').val(quoteBalance/Math.pow(10,Number($('#quoteDecimals').val()) ));
}


async function refreshAllowance() {

	var the_router	=	$('#currentRouter').val();
	the_accounts 	= await ethereum.request({ method: 'eth_requestAccounts'});
    the_account		= the_accounts[0];
					
	var allowBase	=	await checkAllowance(the_account,$('#baseToken').val(),the_router);
	var allowQuote	=	await checkAllowance(the_account,$('#quoteToken').val(),the_router);
	$('#baseTokenAllowance').val(allowBase);
	$('#quoteTokenAllowance').val(allowQuote);
					
}


function fullLoadPair(pair) {
	$('#marketSellSlider').slider({ value: 0 });
	$('#marketBuySlider').slider({ value: 0 });
	$('#marketBuySlider .ui-slider-handle').html('<span style="font-size:9px;color:white;text-shadow:0px 1px 2px black;">0%</span>');
	$('#marketSellSlider .ui-slider-handle').html('<span style="font-size:9px;color:white;text-shadow:0px 1px 2px black;">0%</span>');
	$('#amount_marketSellQuote').val('');
	$('#amount_marketBuyQuote').val('');
	$('#amount_marketBuyBase').val('');
	$('#amount_marketSellBase').val('');
	var inputPair	= $('#selectedPair').val(''+pair+'');
	loadDataPair(pair);
	widget.activeChart().setSymbol(''+pair+'');
	loadTradePair(pair, "USD");
	loadTradeByToken($('#baseToken').val(), 'USD');
}


var eth_socket;
function updateDerivedPrice(id) {	
		try {
			switch(id) {
				case 1:
					var url	=	"ethusdt@aggTrade";
					break;
				case 137:
					var url	=	"ethusdt@aggTrade";
					break;
				case 250:
					var url	=	"ftmusdt@aggTrade";
					break;
				default:
					var url	=	"ethusdt@aggTrade";
					break;
			}
			try { eth_socket.close(); } catch { }
			eth_socket = new WebSocket("wss://stream.binance.com:9443/stream?streams="+url+"");
			//	--	FTX
			// eth_socket = new WebSocket("wss://ftx.com/ws/");
			
		} catch (exception) { }

		eth_socket.onopen = function(event) {
			// --	FTX
			// eth_socket.send('{"op": "subscribe", "channel": "trades", "market": "ETH-PERP"}');
			this.onmessage = function(event) {
				
    			the_message	=	JSON.parse(event.data);
    			
    			// 	-- FTX
    			// if(the_message.type == "update") {
        		// the_price	=	the_message.data[0].price;
        		// }
				the_price	=	the_message.data.p;
				$('#eth_price').val(the_price); 
				
				
				eth_price	= $('#eth_price').val();
				
				$('.topETH').each(function() { 
					var derivedETH	=	$(this).attr('derivedETH');
					var new_price	=	derivedETH*eth_price;
					$(this).html(new Intl.NumberFormat('en-US').format(new_price));
				});
				
    		};

		};
	}
	
	
function openLeftMenu() {
	var menu = $('#leftBar').val();
	if(menu == 0) {
		$('#leftBar').val(1);
		$('#listMarket').hide();
		$('#listSettings').show();
		$('#menuLeft').attr('class', 'fal fa-times menu');
	} else {
		$('#leftBar').val(0);
		$('#listMarket').show();
		$('#listSettings').hide();
		$('#menuLeft').attr('class', 'fas fa-bars menu');
	}
}


function loadPrice(chainID) {
	switch(chainID) {
		case 1:
			return $.get({	url:	"https://api.binance.com/api/v3/ticker/price", data: 	{ symbol: "ETHUSDC" },
			success: function(data) { $('#eth_price').val(data.price); } });
			break;
		case 137:
			return $.get({	url:	"https://api.binance.com/api/v3/ticker/price", data: 	{ symbol: "ETHUSDC" },
			success: function(data) { $('#eth_price').val(data.price); } });
			break;
		case 250:
			return $.get({	url:	"https://api.binance.com/api/v3/ticker/price", data: 	{ symbol: "FTMUSDT" },
			success: function(data) { $('#eth_price').val(data.price); } });
			break;
		default:
			return $.get({	url:	"https://api.binance.com/api/v3/ticker/price", data: 	{ symbol: "ETHUSDC" },
			success: function(data) { $('#eth_price').val(data.price); } });
		break;
	}
}


function changeChain(chainID) {
	$('#listMarket').html('');
	switch(chainID) {
		case 1:
			$('#chainID').val(1);
			$('#chainName').val('Ethereum');
			$('#titleWrap').html('Convert ETH to WETH');
			$('#spanWrap').html('Convert ETH to WETH');
			$('#spanUnwrap').html('Convert WETH to ETH');
			$('#convertBase').html('ETH');
			$('#convertQuote').html('WETH');
			
			$('#selectedPair').val('0xceff51756c56ceffca006cd410b03ffc46dd3a58');
			$('#checkMenuETH').html('<i class="far fa-check blue"></i>');$('#menuETH').css('opacity', '1');
			$('#checkMenuPLG').html('');$('#menuPLG').css('opacity', '0.7');
			$('#checkMenuFTM').html('');$('#menuFTM').css('opacity', '0.7');
			loadPrice(1).then( function() {
				updateDerivedPrice(1);
				load_market();
				loadTradePair('0xceff51756c56ceffca006cd410b03ffc46dd3a58', 'USD');
				tvWidget.activeChart().setSymbol('0xceff51756c56ceffca006cd410b03ffc46dd3a58');
			});
			$('#currentExplorer').val('etherscan.io');
			loadOrderHistory('USD');
			break;
		case 137:
			$('#chainID').val(137);
			$('#chainName').val('Polygon');
			$('#titleWrap').html('Convert MATIC to WMATIC');
			$('#spanWrap').html('Convert MATIC to WMATIC');
			$('#spanUnwrap').html('Convert WMATIC to MATIC');
			$('#convertBase').html('MATIC');
			$('#convertQuote').html('WMATIC');
			
			$('#selectedPair').val('0xe62ec2e799305e0d367b0cc3ee2cda135bf89816');
			$('#checkMenuETH').html('');$('#menuETH').css('opacity', '0.7');
			$('#checkMenuPLG').html('<i class="far fa-check blue"></i>');$('#menuPLG').css('opacity', '1');
			$('#checkMenuFTM').html('');$('#menuFTM').css('opacity', '0.7');
			loadPrice(137).then( function() {
				updateDerivedPrice(137);
				load_market();
				loadTradePair('0xe62ec2e799305e0d367b0cc3ee2cda135bf89816', 'USD');
				tvWidget.activeChart().setSymbol('0xe62ec2e799305e0d367b0cc3ee2cda135bf89816');
			});
			$('#currentExplorer').val('polygonscan.com');
			loadOrderHistory('USD');
			break;
		case 250:
			$('#chainID').val(250);
			$('#chainName').val('Fantom');
			$('#titleWrap').html('Convert FTM to WFTM');
			$('#spanWrap').html('Convert FTM to WFTM');
			$('#spanUnwrap').html('Convert WFTM to FTM');
			$('#convertBase').html('FTM');
			$('#convertQuote').html('WFTM');
			
			$('#checkMenuETH').html('');$('#menuETH').css('opacity', '0.7');
			$('#checkMenuPLG').html('');$('#menuPLG').css('opacity', '0.7');
			$('#checkMenuFTM').html('<i class="far fa-check blue"></i>');$('#menuFTM').css('opacity', '1');
			$('#selectedPair').val('0x84311ecc54d7553378c067282940b0fdfb913675');
			loadPrice(250).then( function() {
				updateDerivedPrice(250);
				load_market();
				loadTradePair('0x84311ecc54d7553378c067282940b0fdfb913675', 'USD');
				tvWidget.activeChart().setSymbol('0x84311ecc54d7553378c067282940b0fdfb913675');
			});
			$('#currentExplorer').val('ftmscan.com');
			loadOrderHistory('USD');
			break;
		default:
			break;
	}
}


function viewMenu(uid) {
	switch(uid) {
		case 1:
			var is_open	=	$('#openLT').val();
			if(is_open == 1) {
				$('#openLT').val(0);
				$('#divLT').css('opacity', '0.7');
				$('#trLT').hide();
				$('#arrowLastTrade').html('<i class="far fa-angle-right" style="font-size:10px;"></i><span style="font-size:8px;position:absolute;margin-top:2px;margin-left:3px;">open</span>');
			} else {
				$('#openLT').val(1);
				$('#divLT').css('opacity', '1');
				$('#trLT').show();
				$('#arrowLastTrade').html('<i class="far fa-angle-down" style="font-size:10px;"></i><span style="font-size:8px;position:absolute;margin-top:2px;margin-left:3px;">close</span>');
				loadTradePair($('#selectedPair').val(), "USD");
			}
			break;
		case 2:
			var is_open	=	$('#openLTBT').val();
			if(is_open == 1) {
				$('#openLTBT').val(0);
				$('#divLTBT').css('opacity', '0.7');
				$('#trLTBT').hide();
				$('#arrowLastTradeByToken').html('<i class="far fa-angle-right" style="font-size:10px;"></i><span style="font-size:8px;position:absolute;margin-top:2px;margin-left:3px;">open</span>');
			} else {
				$('#openLTBT').val(1);
				$('#divLTBT').css('opacity', '1');
				$('#trLTBT').show();
				$('#arrowLastTradeByToken').html('<i class="far fa-angle-down" style="font-size:10px;"></i><span style="font-size:8px;position:absolute;margin-top:2px;margin-left:3px;">close</span>');
				loadTradeByToken($('#baseToken').val(), 'USD');
			}
			break;
			
		case 3:
			var is_open	=	$('#openOH').val();
			if(is_open == 1) {
				$('#openOH').val(0);
				$('#divOH').css('opacity', '0.7');
				$('#trOH').hide();
				$('#arrowOrderHistory').html('<i class="far fa-angle-right" style="font-size:10px;"></i><span style="font-size:8px;position:absolute;margin-top:2px;margin-left:3px;">open</span>');
			} else {
				$('#openOH').val(1);
				$('#divOH').css('opacity', '1');
				$('#trOH').show();
				$('#arrowOrderHistory').html('<i class="far fa-angle-down" style="font-size:10px;"></i><span style="font-size:8px;position:absolute;margin-top:2px;margin-left:3px;">close</span>');	
				loadOrderHistory('USD');
			}
			break;
		
		case 4:
			break;
			
		case 5:
			var is_open	=	$('#openMO').val();
			if(is_open == 1) {
				$('#openMO').val(0);
				$('#divMO').css('opacity', '0.7');
				$('#trMO').hide();
				$('#arrowMarketOrder').html('<i class="far fa-angle-right" style="font-size:10px;"></i><span style="font-size:8px;position:absolute;margin-top:2px;margin-left:3px;">open</span>');
			
			} else {
				$('#openMO').val(1);
				$('#divMO').css('opacity', '1');
				$('#trMO').show();
				$('#arrowMarketOrder').html('<i class="far fa-angle-down" style="font-size:10px;"></i><span style="font-size:8px;position:absolute;margin-top:2px;margin-left:3px;">close</span>');
				
			}
			break;
			
		case 6:
			var is_open	=	$('#openCV').val();
			if(is_open == 1) {
				$('#openCV').val(0);
				$('#divCV').css('opacity', '0.7');
				$('#trCV').hide();
				$('#arrowConverter').html('<i class="far fa-angle-right" style="font-size:10px;"></i><span style="font-size:8px;position:absolute;margin-top:2px;margin-left:3px;">open</span>');
			
			} else {
				$('#openCV').val(1);
				$('#divCV').css('opacity', '1');
				$('#trCV').show();
				$('#arrowConverter').html('<i class="far fa-angle-down" style="font-size:10px;"></i><span style="font-size:8px;position:absolute;margin-top:2px;margin-left:3px;">close</span>');
				
			}
			break;
		default:
			break;
	}
}


load_market();
loadTradePair($('#selectedPair').val(), "USD");
updateDerivedPrice(1);


var auto_update = setInterval('load_market();',$('#updateInterval').val());	


$( "#slippageSlider" ).slider({
	value:1,
	min: 0.1,
	max: 5,
	step: 0.1,
	slide: function(event,ui) {
		$('#slippageTolerance').html(ui.value);
		$('#slippageAllowed').val(ui.value);
	}
});


$( "#maximumTimeSlider" ).slider({
	value:20,
	min: 1,
	max: 60,
	step: 1,
	slide: function(event,ui) {
		$('#maximumTime').html(ui.value);
		$('#maximumTimeAllowed').val(ui.value);
	}
});



$("#amount_marketBuyBase").on('input', function(event) { 
		var a0		=	$('#baseReserve').val();
		var a1		=	$('#quoteReserve').val();
		var ad0		=	$('#baseDecimals').val();
		var ad1		=	$('#quoteDecimals').val();
		var input	=	$('#amount_marketBuyBase').val();
		var res0	=	a0*Math.pow(10,ad0);
		var res1	=	a1*Math.pow(10,ad1);
		var amount	=	getAmountOut(input,[res1,res0],ad1,ad0);
		$('#amount_marketBuyQuote').val(amount);
});

$("#amount_marketSellBase").on('input', function(event) { 
		var a0		=	$('#baseReserve').val();
		var a1		=	$('#quoteReserve').val();
		var ad0		=	$('#baseDecimals').val();
		var ad1		=	$('#quoteDecimals').val();
		var input	=	$('#amount_marketSellBase').val();
		var res0	=	a0*Math.pow(10,ad0);
		var res1	=	a1*Math.pow(10,ad1);
		var amount	=	getAmountOut(input,[res0,res1],ad0,ad1);
		$('#amount_marketSellQuote').val(amount);
});

$( "#marketBuySlider" ).slider({
	value:0,
	min: 0,
	max: 100,
	step: 0.5,
	slide: function(event,ui) {
		var bquote		=	$('#balanceQuoteToken').val();
		var quantity	=	(bquote/100)*ui.value;
		$('#amount_marketBuyBase').val(quantity.toFixed(6));
		$('#marketBuySlider .ui-slider-handle').html('<span style="font-size:9px;text-shadow:0px 1px 2px black;color:white;">'+ui.value+'%</span>');
		var a0		=	$('#baseReserve').val();
		var a1		=	$('#quoteReserve').val();
		var ad0		=	$('#baseDecimals').val();
		var ad1		=	$('#quoteDecimals').val();
		var input	=	$('#amount_marketBuyBase').val();
		var res0	=	a0*Math.pow(10,ad0);
		var res1	=	a1*Math.pow(10,ad1);
		var amount	=	getAmountOut(input,[res1,res0],ad1,ad0);
		$('#amount_marketBuyQuote').val(amount);
	}
});


$( "#marketSellSlider" ).slider({
	value:0,
	min: 0,
	max: 100,
	step: 0.5,
	slide: function(event,ui) {
		var bquote		=	$('#balanceBaseToken').val();
		var quantity	=	(bquote/100)*ui.value;
		$('#amount_marketSellBase').val(quantity.toFixed(6));
		$('#marketSellSlider .ui-slider-handle').html('<span style="font-size:9px;text-shadow:0px 1px 2px black;color:white;">'+ui.value+'%</span>');
		var a0		=	$('#baseReserve').val();
		var a1		=	$('#quoteReserve').val();
		var ad0		=	$('#baseDecimals').val();
		var ad1		=	$('#quoteDecimals').val();
		var input	=	$('#amount_marketSellBase').val();
		var res0	=	a0*Math.pow(10,ad0);
		var res1	=	a1*Math.pow(10,ad1);
		var amount	=	getAmountOut(input,[res0,res1],ad0,ad1);
		$('#amount_marketSellQuote').val(amount);
	}
	
});
$('#marketBuySlider .ui-slider-handle').html('<span style="font-size:9px;color:white;">0%</span>');
$('#marketSellSlider .ui-slider-handle').html('<span style="font-size:9px;color:white;">0%</span>');



function decimalToWeiName(decimals) {
	the_decimal = parseInt(decimals);
	switch(the_decimal) {
		case 0:
			weiName = "noether";
			break;
		case 1:
			weiName = "wei";
			break;
		case 2:
			weiName	= "two"; // Added to web3.js
			break;
		case 3:
			weiName = "kwei";
			break;
		case 4:
			weiName	= "four"; // Added to web3.js
			break;
		case 5:
			weiName	= "five";
			break;
		case 6:
			weiName = "mwei";
			break;
		case 7:
			weiName	= "seven"; // Added to web3.js
			break;
		case 8:
			weiName = "eight"; // Added to web3.js
			break;
		case 9:
			weiName = "gwei";
			break;
		case 10:
			weiName = "ten"; // Added to web3.js
			break;
		case 11:
			weiName = "eleven"; // Added to web3.js
			break;
		case 12:
			weiName = "microether";
			break;
		case 15:
			weiName = "milliether";
			break;
		case 18:
			weiName = "ether";
			break;
		case 21:
			weiName = "kether";
			break;
		case 24:
			weiName = "mether";
			break;
		case 27:
			weiName = "gether";
			break;
		case 30:
			weiName = "tether";
			break;
		default:
			weiName = "ether";
	}
	return weiName;
}