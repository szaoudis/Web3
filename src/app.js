App = {
    loading: false,
    contracts: {},
    load: async () => {
        await App.loadWeb3()
        await App.loadAccount()
        await App.loadContract()
        await App.render()
    },

    loadWeb3: async () => {
        if (typeof web3 !== 'undefined') {
          App.web3Provider = web3.currentProvider
          web3 = new Web3(web3.currentProvider)
        } else {
          window.alert("Please connect to Metamask.")
        }
        // Modern dapp browsers...
        if (window.ethereum) {
          window.web3 = new Web3(ethereum)
          try {
            // Request account access if needed
            await ethereum.enable()
            // Acccounts now exposed
            web3.eth.sendTransaction({/* ... */})
          } catch (error) {
            // User denied account access...
          }
        }
        // Legacy dapp browsers...
        else if (window.web3) {
          App.web3Provider = web3.currentProvider
          window.web3 = new Web3(web3.currentProvider)
          // Acccounts always exposed
          web3.eth.sendTransaction({/* ... */})
        }
        // Non-dapp browsers...
        else {
          console.log('Non-Ethereum browser detected. You should consider trying MetaMask!')
        }
      },

      loadAccount: async() => {
        web3.eth.defaultAccount = web3.eth.accounts[0]
        App.account = web3.eth.defaultAccount
      },

      loadContract: async() => {
        const todoList = await $.getJSON('TodoList.json')
        App.contracts.TodoList = TruffleContract(todoList)
        App.contracts.TodoList.setProvider(App.web3Provider)

        App.todoList = await App.contracts.TodoList.deployed()
      },

      render: async() => {
        if(App.loading) {
          return 0;
        }

        App.setLoading(true)

        $('#account').html(App.account)

        await App.renderTasks()

        App.setLoading(false)
      },

      renderTasks: async() => {
        const taskCount = await App.todoList.taskCount()
        const $taskTemplate = $('.taskTemplate')

        for(var i=1; i<=taskCount; i++) {
          const task = await App.todoList.tasks(i)
          const taskId = task[0].toNumber()
          const taskContent = task[1]
          const taskCompleted = task[2]

          const $newTaskTemplate = $taskTemplate.clone()
          $newTaskTemplate.find('.content').html(taskContent)
          $newTaskTemplate.find('input')
                          .prop('name', taskId)
                          .prop('checked', taskCompleted)
                          .on('click', App.toggleCompleted)

          if (taskCompleted) {
            $('#completedTaskList').append($newTaskTemplate)
          } else {
            $('#taskList').append($newTaskTemplate)
          }

          $newTaskTemplate.show()
        }
      },

      createTask: async() => {
        App.setLoading(true)
        const content = $('#newTask').val()
        await App.todoList.createTask(content)
        window.location.reload()
      },

      toggleCompleted: async(e) => {
        App.setLoading()
        const taskId = e.target.name
        await App.todoList.toggleCompleted(taskId)
        window.location.reload()
      },

      setLoading: (boolean) => {
        App.loading = boolean
        const loader = $('#loader')
        const content = $('#content')
        if(boolean) {
          loader.show()
          content.hide()
        } else {
          loader.hide()
          content.show()
        }
      },

      makeTransaction: async() => {
        //Transaction payload
        const transactionParameters = {
          nonce: '0x00', // ignored by MetaMask
          gasPrice: '0x09184e72a000', // customizable by user during MetaMask confirmation.
          gas: '0x5500', // customizable by user during MetaMask confirmation.
          to: '0xAd160fC4e443368B7bBEBc4714eF351849409ef0', // Required except during contract publications.
          from: ethereum.selectedAddress, // must match user's active address.
          value: '0xDE0B6B3A7640000', // Only required to send ether to the recipient from the initiating external account.
          data: '0x7f7465737432000000000000000000000000000000000000000000000000000000600057', // Optional, but used for defining smart contract creation and interaction.
          chainId: '0x3', // Used to prevent transaction reuse across blockchains. Auto-filled by MetaMask.
        };

        //Transaction Call
        const txHash = await ethereum.request({
          method: 'eth_sendTransaction',
          params: [transactionParameters],
        });
      }
      
}

$(() => {
    $(window).load(() => {
        App.load()
    })
})