function getAmountOut(input,a,dec0,dec1) {
	var a0	= a[0]*1000; var a1	= a[1]; var i = input*Math.pow(10,dec0); var o = (i*997*a1)/(a0+(i*997));
	return o/Math.pow(10,dec1);
}



function isMetaMaskInstalled() {
	const { ethereum } = window;
    return Boolean(ethereum && ethereum.isMetaMask);
}




function verifMetamask(ui) {
	var install	=	isMetaMaskInstalled();
	if(install == 0) {
		$('#buttonConnect').html('<a href="https://metamask.io/download.html" style="color:white;text-decoration:none;">Install Metamask</a>');
	} else { 
		checkIsConnected();
		ethereum.on('accountsChanged', function() { accountChanged(); });
		ethereum.on('chainChanged', (cid) => { checkChainID(); });
	}
}



async function connectMyWallet() {
	try {
    	the_accounts 	= await ethereum.request({ method: 'eth_requestAccounts'});
    	the_account		= the_accounts[0];
		
		$('#buttonConnect').hide();
		$('#statusWallet').css('color', '#26a69a');
		$('#swapRecipient').val(the_account);
		$('#statusWallet').html('connected');
		// connected
		$('#isWalletConnected').val(1);
		checkChainID();
		
	} catch (e) { }
}

async function accountChanged() {
	var the_accounts 	= await ethereum.request({ method: 'eth_accounts'});
    if(the_accounts.length > 0) {
		the_account		= the_accounts[0];
		
    	$('#buttonConnect').hide();
		$('#statusWallet').css('color', '#26a69a');
		$('#statusWallet').html('connected');
		$('#swapRecipient').val(the_account);
		// connected
		$('#isWalletConnected').val(1);
		checkChainID();
		loadOrderHistory('USD');
		
    } else {
    	$('#buttonConnect').show();
		$('#statusWallet').css('color', '#bf7474');
		$('#statusWallet').html('disconnected');
		$('#swapRecipient').val('');
		// disconnected
		$('#isWalletConnected').val(0);
		$('#networkWallet').html('...');

    }
    
}

async function checkIsConnected() {
	var the_accounts 	= await ethereum.request({ method: 'eth_accounts'});
    if(the_accounts.length > 0) {
		the_account		= the_accounts[0];
		
    	$('#buttonConnect').hide();
		$('#statusWallet').css('color', '#26a69a');
		$('#statusWallet').html('connected');
		$('#swapRecipient').val(the_account);
		// connected
		$('#isWalletConnected').val(1);
		checkChainID();
		
    } else {
    	$('#buttonConnect').show();
		$('#statusWallet').css('color', '#bf7474');
		$('#statusWallet').html('disconnected');
		$('#swapRecipient').val('');
		// disconnected
		$('#isWalletConnected').val(0);
		$('#networkWallet').html('...');

    }
    
}

async function checkChainID() {
	try {
		var wallet_chainID	=	ethereum.chainId;
		
		switch(wallet_chainID) {
			case "0x1":
				var currentChain	=	$('#walletChainID').val();
				$('#networkWallet').html('Ethereum');
				$('#walletChainID').val(1);
				if(currentChain != 1) {
					$('#currentRouter').val('0xd9e1ce17f2641f24ae83637ab66a2cca9c378b9f');
					$('#currentExplorer').val('etherscan.io');
					changeChain(1);
				} else { }
				break;
			case "0x89":
				var currentChain	=	$('#walletChainID').val();
				$('#networkWallet').html('Polygon');
				$('#walletChainID').val(137);
				if(currentChain != 137) {
					$('#currentRouter').val('0x1b02dA8Cb0d097eB8D57A175b88c7D8b47997506');
					$('#currentExplorer').val('polygonscan.com');
					changeChain(137);
				} else { }
				break;
			case "0xfa":
				var currentChain	=	$('#walletChainID').val();
				$('#networkWallet').html('Fantom');
				$('#walletChainID').val(250);
				if(currentChain != 250) {
					$('#currentRouter').val('0x1b02dA8Cb0d097eB8D57A175b88c7D8b47997506');
					$('#currentExplorer').val('ftmscan.com');
					changeChain(250);
				} else { }
				break;
			default:
				$('#networkWallet').html('...');
				break;
		}
	} catch { }
}




async function getBalance(theToken,walletAddress) {
	tokenAddress	= theToken;
	askABI = [
  		{
   		"constant":true,
    	"inputs":[{"name":"_owner","type":"address"}],
    	"name":"balanceOf",
    	"outputs":[{"name":"balance","type":"uint256"}],
    	"type":"function"
  		}
  	];
	
	var contract			= await new web3.eth.Contract(askABI,tokenAddress);
	var ERC20_balance 		= await contract.methods.balanceOf(walletAddress).call();
  	return ERC20_balance;
}




async function checkAllowance(the_address,the_token,router) {
	askABI = [
  	{	"constant":true,
  		"inputs":[{"internalType":"address","name":"account","type":"address"},{"internalType":"address","name":"spender","type":"address"}],
  		"name":"allowance",
  		"outputs":[{"internalType":"uint256","name":"","type":"uint256"}],
  		"type":"function"
  	}
  	];
  	
  	var contract	= await new web3.eth.Contract(askABI,""+the_token+"");
  	var allowance	= await contract.methods.allowance(""+the_address+"", ""+router+"").call();
  	
  	return allowance;

}


function getApprovalData() {
	var router	= $('#currentRouter').val();
	var data	= web3.eth.abi.encodeFunctionCall(
    {
      type: 'function',
      name: 'approve',
      inputs: [
      	{
          name: 'spender',
          type: 'address',
        },
        {
          name: 'rawAmount',
          type: 'uint256',
        },
      ],
    },
    [
      router,
      "115792089237316195423570985008687907853269984665640564039457584007913129639935",
    ]
  );
  
  return data;
}


async function swapNow(id) {
	
	
	// Check if the user is connected and if same chain
	var is_connected	=	$('#isWalletConnected').val();
	var interfaceChain	=	$('#chainID').val();
	
	// scrollTop
	window.scrollTo(0,0);
	
	if(is_connected == 1) {
		
		
		// Same chain ?
		if(web3.utils.toHex(interfaceChain) == ethereum.chainId) {
			// Refresh Allowance
			await refreshAllowance();
	
			switch(id) {
		case 1:
			var amount_IN		=	Number($('#amount_marketBuyBase').val());
			var amount_OUT		=	Number($('#amount_marketBuyQuote').val());
			var token_input		=	$('#quoteToken').val();
			var token_output	=	$('#baseToken').val();
			var decimal_input	=	Number($('#quoteDecimals').val());
			var decimal_output	=	Number($('#baseDecimals').val());
			var allowance		=	$('#quoteTokenAllowance').val();
			var tokenInName		=	$('#marketBuyBase').html();
			var tokenOutName	=	$('#marketBuyQuote').html();
			var side			=	"BUY";
			break;
		case 2:
			var amount_IN		=	Number($('#amount_marketSellBase').val());
			var amount_OUT		=	Number($('#amount_marketSellQuote').val());
			var token_input		=	$('#baseToken').val();
			var token_output	=	$('#quoteToken').val();
			var decimal_input	=	Number($('#baseDecimals').val());
			var decimal_output	=	Number($('#quoteDecimals').val());
			var allowance		=	$('#baseTokenAllowance').val();
			var tokenInName		=	$('#marketSellBase').html();
			var tokenOutName	=	$('#marketSellQuote').html();
			var side			=	"SELL";
			break;
	}
	
			var slippage	=	$('#slippageAllowed').val();
			var min_amount	=	(amount_OUT-((amount_OUT/100)*slippage));
	
			var minimum_out	=	web3.utils.toWei(''+amount_IN+'', ''+decimalToWeiName(decimal_output)+'');
	
			var the_accounts 	= await ethereum.request({ method: 'eth_accounts'});
   			var	the_account		= the_accounts[0];
   	
   			var recipient		= $('#swapRecipient').val();
		
			var explorer		= $('#currentExplorer').val();
			var router			= $('#currentRouter').val();
	
			if(allowance == 0) { 
	
		var data_encoded = getApprovalData();
	
		web3.eth.estimateGas({ from: the_account, to: ''+token_input+'',data: data_encoded }).then(
			function (estimatedGas) {
				var maxGas	=	(parseInt(estimatedGas)+(parseInt(estimatedGas)/10)).toFixed(0);	
				web3.eth.sendTransaction({
					from: the_account,
					to: ''+token_input+'',				
					gasPrice: web3.utils.toWei('50','Gwei'),						
					gas:maxGas,														
    				data: data_encoded
    			}).once('error', function(receipt) {
    				if(id == 1) {	$('#buttonMarketBuy').html('APPROVE BEFORE BUY '); }
    				else { $('#buttonMarketSell').html('APPROVE BEFORE SELL');	}
    				
    				
    				$('.miniTitle').html('ERROR - Approval failed for <span class="blue">'+tokenInName+'</span>');
    				$('.miniPrelink').html('Sadly, the approval has not been done.');	
    				$('#miniLink').attr('href', '');
    				$('#miniLink').html('');
    				$('.miniText').html('Please retry, your transaction has failed.');
    				$('.miniPopup').show();
    				
    				
    				$('#currentTx').val('0');
    				
    			}).once('transactionHash', function(hash){
    				if(id == 1) {	$('#buttonMarketBuy').html('<i style="color:white;" class="far fa-sync-alt fa-spin"></i> Approval in progress...'); }
    				else { $('#buttonMarketSell').html('<i style="color:white;" class="far fa-sync-alt fa-spin"></i> Approval in progress...');	}
    					
    				$('.miniTitle').html('APPROVE <span class="blue">'+tokenInName+'</span>');	
    				$('#miniLink').attr('href', 'https://'+explorer+'/tx/'+hash+'');
    				$('#miniLink').html(explorer);
    				$('.miniPrelink').html('You can view your transaction here : ');	
    				$('.miniText').html('You will receive a notification when your approval will be confirmed.');
    				$('.miniPopup').show();
    				
    				$('#currentTx').val(1);
    				
    			}).once('receipt', function(receipt){
    				
    				if(id == 1) {	$('#buttonMarketBuy').html(side); }
    				else { $('#buttonMarketSell').html(side);	}
					
					$('.miniTitle').html('APPROVE <span class="blue">'+tokenInName+'</span>');	
					$('.miniPrelink').html('You can view your transaction here : ');	
    				$('#miniLink').attr('href', 'https://'+explorer+'/tx/'+receipt.transactionHash+'');
    				$('#miniLink').html(explorer);
    				$('.miniText').html('Your transaction has been confirmed.');
    				$('.miniPopup').show();
					
					$('#currentTx').val('O');
				});
			}
		);
	} 
			else {
		
		var encoded_data	=	swapExactTokensForTokens(amount_IN, min_amount, decimal_input, decimal_output, [token_input,token_output], recipient);
		
		web3.eth.estimateGas({ from: the_account, to: ''+router+'',data: encoded_data }).then(
			function (estimatedGas) {
				
				var maxGas	=	(parseInt(estimatedGas)+(parseInt(estimatedGas)/10)).toFixed(0);	
				web3.eth.sendTransaction({
					from: the_account,
					to: ''+router+'',				
					gasPrice: web3.utils.toWei('50','Gwei'),						
					gas:maxGas,														
    				data: encoded_data
    			}).once('error', function(receipt) {
    				if(id == 1) {	$('#buttonMarketBuy').html('Error - please retry later'); }
    				else { $('#buttonMarketSell').html('Error - please retry later');	}
    				
    				
    				$('.miniTitle').html(side+' <span class="blue" style="font-size:10px;">'+amount_IN+' '+tokenInName+'</span> -> <span class="blue" style="font-size:10px;">'+amount_OUT+' '+tokenOutName+'</span>');	
					$('.miniPrelink').html('Sadly, your order has not been completed.');	
    				$('#miniLink').attr('href', '');
    				$('#miniLink').html('');
    				$('.miniText').html('Please retry, your transaction has failed.');
    				$('.miniPopup').show();
    				
    				
    				$('#currentTx').val('0');
    				
    			}).once('transactionHash', function(hash){
    				if(id == 1) {	$('#buttonMarketBuy').html('<i style="color:white;" class="far fa-sync-alt fa-spin"></i> Order in progress...'); }
    				else { $('#buttonMarketSell').html('<i style="color:white;" class="far fa-sync-alt fa-spin"></i> Order in progress...');	}
    					
    				$('.miniTitle').html(side+' <span class="blue" style="font-size:10px;">'+amount_IN+' '+tokenInName+'</span> -> <span class="blue" style="font-size:10px;">'+amount_OUT+' '+tokenOutName+'</span>');	
					$('#miniLink').attr('href', 'https://'+explorer+'/tx/'+hash+'');
    				$('#miniLink').html(explorer);
    				$('.miniPrelink').html('You can view your transaction here : ');	
    				$('.miniText').html('You will receive a notification when your transaction will be confirmed.');
    				$('.miniPopup').show();
    				
    				$('#currentTx').val(1);
    				
    			}).once('receipt', function(receipt){
    				
    				if(id == 1) {	$('#buttonMarketBuy').html(side); }
    				else { $('#buttonMarketSell').html(side);	}
					
					$('.miniTitle').html(side+' <span class="blue" style="font-size:10px;">'+amount_IN+' '+tokenInName+'</span> -> <span class="blue" style="font-size:10px;">'+amount_OUT+' '+tokenOutName+'</span>');	
					$('.miniPrelink').html('You can view your transaction here : ');	
    				$('#miniLink').attr('href', 'https://'+explorer+'/tx/'+receipt.transactionHash+'');
    				$('#miniLink').html(explorer);
    				$('.miniText').html('Your transaction has been confirmed.');
    				$('.miniPopup').show();
					
					$('#currentTx').val('O');
					
					refreshBalance();
				});
				
				
				
			}
		).catch(
			function(error) {
				
				
				$('.miniTitle').html(side+' <span class="blue" style="font-size:10px;">'+amount_IN+' '+tokenInName+'</span> -> <span class="blue" style="font-size:10px;">'+amount_OUT+' '+tokenOutName+'</span>');	
				$('.miniPrelink').html('Hmm.. something wrong happened. Please check : your balance, your RPC node or maybe one of the token has a problem.');	
    			$('#miniLink').attr('href', '');
    			$('#miniLink').html('');
    			$('.miniText').html('');
    			$('.miniPopup').show();
					
				$('#currentTx').val('O');
			}
		);
		
		
	}
		} else {
		
			$('.miniTitle').html('ERROR - Wrong chain');	
			$('.miniPrelink').html('It seems your wallet is connected on an other chain.');	
    		$('#miniLink').attr('href', '');
    		$('#miniLink').html('');
    		$('.miniText').html('Please switch to the correct chain and retry.');
    		$('.miniPopup').show();
    		$('#currentTx').val('0');
		}
	
	} else {
	
		$('.miniTitle').html('ERROR - Not connected');	
			$('.miniPrelink').html('It seems your wallet is not connected.');	
    		$('#miniLink').attr('href', '');
    		$('#miniLink').html('');
    		$('.miniText').html('Please connect your wallet. If the problem persist, try to refresh the page.');
    		$('.miniPopup').show();
    		$('#currentTx').val('0');
	}
}



function convert(id) {
	
	// Check if the user is connected and if same chain
	var is_connected	=	$('#isWalletConnected').val();
	var interfaceChain	=	$('#chainID').val();
	var explorer		= $('#currentExplorer').val();
	
	switch(Number(interfaceChain)) {
		case 1:
			var token = $('#wrappedETH').val();
			break;
		case 137:
			var token = $('#wrappedPLG').val();
			break;
		case 250:
			var token = $('#wrappedFTM').val();
			break;
	}
	
	// scrollTop
	window.scrollTo(0,0);
	
	if(is_connected == 1) {
		if(web3.utils.toHex(interfaceChain) == ethereum.chainId) {
		
		if(id == 1) {
	
			var deposit	= web3.eth.abi.encodeFunctionCall( {"constant":false,"inputs":[],"name":"deposit","outputs":[],"payable":true,"stateMutability":"payable","type":"function"} , [] );
  			var amount	= Number($('#amount_WRAP').val());
  		
  			web3.eth.estimateGas({ from: the_account, value: web3.utils.toWei(''+amount+'', 'ether'), to: ''+token+'',data: deposit }).then(
				function (estimatedGas) {
				
					var maxGas	=	(parseInt(estimatedGas)+(parseInt(estimatedGas)/10)).toFixed(0);
  					web3.eth.sendTransaction({
					from: the_account,
					to: ''+token+'',
					value: web3.utils.toWei(''+amount+'', 'ether'),			
					gasPrice: web3.utils.toWei('50','Gwei'),						
					gas:maxGas,														
    				data: deposit
    				}).once('error', function(receipt) {
    				if(id == 1) {	$('#convertButton1').html('WRAP '); }
    				else { $('#convertButton2').html('UNWRAP');	}
    				
    				
    				$('.miniTitle').html('ERROR - WRAP FAILED');
    				$('.miniPrelink').html('Sadly, the wrap has not been done.');	
    				$('#miniLink').attr('href', '');
    				$('#miniLink').html('');
    				$('.miniText').html('Please retry, your transaction has failed.');
    				$('.miniPopup').show();
    				
    				
    				$('#currentTx').val('0');
    				
    			}).once('transactionHash', function(hash){
    				if(id == 1) {	$('#convertButton1').html('<i style="color:white;" class="far fa-sync-alt fa-spin"></i> Wrap in progress...'); }
    				else { $('#convertButton2').html('<i style="color:white;" class="far fa-sync-alt fa-spin"></i> Unwrap in progress...');	}
    					
    				$('.miniTitle').html('WRAP IN PROGRESS');	
    				$('#miniLink').attr('href', 'https://'+explorer+'/tx/'+hash+'');
    				$('#miniLink').html(explorer);
    				$('.miniPrelink').html('You can view your transaction here : ');	
    				$('.miniText').html('You will receive a notification when your tokens will be wrapped.');
    				$('.miniPopup').show();
    				
    				$('#currentTx').val(1);
    				
    			}).once('receipt', function(receipt){
    				
    				if(id == 1) {	$('#convertButton1').html('WRAP'); }
    				else { $('#convertButton2').html('UNWRAP');	}
					
					$('.miniTitle').html('WRAP FINISHED');	
					$('.miniPrelink').html('You can view your transaction here : ');	
    				$('#miniLink').attr('href', 'https://'+explorer+'/tx/'+receipt.transactionHash+'');
    				$('#miniLink').html(explorer);
    				$('.miniText').html('Your transaction has been confirmed.');
    				$('.miniPopup').show();
					
					$('#currentTx').val('O');
					refreshBalance();
				});
    			}
    		).catch(
			function(error) {
				
				
				$('.miniTitle').html('ERROR - Internal error');	
				$('.miniPrelink').html('Hmm.. something wrong happened. Please check : your balance, your RPC node or maybe one of the token has a problem.');	
    			$('#miniLink').attr('href', '');
    			$('#miniLink').html('');
    			$('.miniText').html('');
    			$('.miniPopup').show();
					
				$('#currentTx').val('O');
			}
			);
	
		} else { 
		
			var amount		= Number($('#amount_UNWRAP').val());
			var withdraw	= web3.eth.abi.encodeFunctionCall( {"constant":false,"inputs":[{"name":"wad","type":"uint256"}],"name":"withdraw","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"}, [web3.utils.toWei(''+amount+'', 'ether')]);
  			
  			web3.eth.estimateGas({ from: the_account, to: ''+token+'',data: withdraw }).then(
				function (estimatedGas) {
				
					var maxGas	=	(parseInt(estimatedGas)+(parseInt(estimatedGas)/10)).toFixed(0);
  					web3.eth.sendTransaction({
					from: the_account,
					to: ''+token+'',		
					gasPrice: web3.utils.toWei('50','Gwei'),						
					gas:maxGas,														
    				data: withdraw
    				}).once('error', function(receipt) {
    				if(id == 1) {	$('#convertButton1').html('WRAP '); }
    				else { $('#convertButton2').html('UNWRAP');	}
    				
    				
    				$('.miniTitle').html('ERROR - UNWRAP FAILED');
    				$('.miniPrelink').html('Sadly, the unwrap has not been done.');	
    				$('#miniLink').attr('href', '');
    				$('#miniLink').html('');
    				$('.miniText').html('Please retry, your transaction has failed.');
    				$('.miniPopup').show();
    				
    				
    				$('#currentTx').val('0');
    				
    				}).once('transactionHash', function(hash){
    				if(id == 1) {	$('#convertButton1').html('<i style="color:white;" class="far fa-sync-alt fa-spin"></i> Wrap in progress...'); }
    				else { $('#convertButton2').html('<i style="color:white;" class="far fa-sync-alt fa-spin"></i> Unwrap in progress...');	}
    					
    				$('.miniTitle').html('UNWRAP IN PROGRESS');	
    				$('#miniLink').attr('href', 'https://'+explorer+'/tx/'+hash+'');
    				$('#miniLink').html(explorer);
    				$('.miniPrelink').html('You can view your transaction here : ');	
    				$('.miniText').html('You will receive a notification when your tokens will be unwrapped.');
    				$('.miniPopup').show();
    				
    				$('#currentTx').val(1);
    				
    				}).once('receipt', function(receipt){
    				
    				if(id == 1) {	$('#convertButton1').html('WRAP'); }
    				else { $('#convertButton2').html('UNWRAP');	}
					
					$('.miniTitle').html('UNWRAP FINISHED');	
					$('.miniPrelink').html('You can view your transaction here : ');	
    				$('#miniLink').attr('href', 'https://'+explorer+'/tx/'+receipt.transactionHash+'');
    				$('#miniLink').html(explorer);
    				$('.miniText').html('Your transaction has been confirmed.');
    				$('.miniPopup').show();
					
					$('#currentTx').val('O');
					refreshBalance();
				});
    			}
    		).catch(
			function(error) {
				
				
				$('.miniTitle').html('ERROR - Internal error');	
				$('.miniPrelink').html('Hmm.. something wrong happened. Please check : your balance, your RPC node or maybe one of the token has a problem.');	
    			$('#miniLink').attr('href', '');
    			$('#miniLink').html('');
    			$('.miniText').html('');
    			$('.miniPopup').show();
					
				$('#currentTx').val('O');
			}
			);
	
		}
		
		
		} else {
			$('.miniTitle').html('ERROR - Wrong chain');	
			$('.miniPrelink').html('It seems your wallet is connected on an other chain.');	
    		$('#miniLink').attr('href', '');
    		$('#miniLink').html('');
    		$('.miniText').html('Please switch to the correct chain and retry.');
    		$('.miniPopup').show();
    		$('#currentTx').val('0');
		
		}
	
	} else {
	
		$('.miniTitle').html('ERROR - Not connected');	
		$('.miniPrelink').html('It seems your wallet is not connected.');	
    	$('#miniLink').attr('href', '');
    	$('#miniLink').html('');
    	$('.miniText').html('Please connect your wallet. If the problem persist, try to refresh the page.');
    	$('.miniPopup').show();
    	$('#currentTx').val('0');
	}

}

function swapExactTokensForTokens(amountIN, amountOUT, decimalsIN, decimalsOUT, routing, recipient) {
	
	var maxTime			= $('#maximumTimeAllowed').val();
	var userDeadline	= maxTime*60;
	var now				= Math.floor(Date.now() / 1000);
	var deadline		= now+userDeadline;
	var weiOUT			= decimalToWeiName(decimalsOUT);
	var weiIN			= decimalToWeiName(decimalsIN);

	
	var DATA_swapExactTokensForTokens   = web3.eth.abi.encodeFunctionCall(
    {
      type: 'function',
      name: 'swapExactTokensForTokens',
      inputs: [
        {
          name: 'amountIn',
          type: 'uint256',
        },
        {
          name: 'amountOutMin',
          type: 'uint256',
        },
        {
          name: 'path',
          type: 'address[]',
        },
        {
          name: 'to',
          type: 'address',
        },
        {
          name: 'deadline',
          type: 'uint256',
        },
      ],
    },
    [
      web3.utils.toWei(''+amountIN.toFixed(decimalsIN)+'', ''+weiIN+''),
      web3.utils.toWei(''+amountOUT.toFixed(decimalsOUT)+'', ''+weiOUT+''),
      routing,
      recipient,
      deadline,
    ]
  );
  	
  return DATA_swapExactTokensForTokens;
}


/**	---	0x1		=	ETH		=	0xd9e1ce17f2641f24ae83637ab66a2cca9c378b9f	=	0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2
	--- 0x89	=	PLG		=	0x1b02dA8Cb0d097eB8D57A175b88c7D8b47997506	=	0x0d500b1d8e8ef31e21c99d1db9a6444d3adf1270
	--- 0xfa	=	FTM		=	0x1b02dA8Cb0d097eB8D57A175b88c7D8b47997506	=	0x21be370d5312f44cb42ce377bc9b8a0cef1a4c83
	---	Launch				**/
window.web3 = new Web3(Web3.givenProvider);
verifMetamask();
setInterval('checkIsConnected();', 5000);