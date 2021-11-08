import 'babel-polyfill';
import * as tf from '@tensorflow/tfjs';
tf.ENV.set('WEBGL_PACK', false);  // This needs to be done otherwise things run very slow v1.0.4
import links from './links';
import { Extension, StdFee, LCDClient, MsgExecuteContract } from "@terra-money/terra.js";




export function canvasToArrayBuffer(canvas) {
  return new Promise((resolve, reject) => canvas.toBlob(async (d) => {
    if (d) {
      const r = new FileReader();
      r.addEventListener('loadend', e => {
        const ab = r.result;
        if (ab) {
          resolve(ab);
        }
        else {
           reject(new Error('Expected FileReader result'));
        }
      }); r.addEventListener('error', e => {
        reject(e)
      });
      r.readAsArrayBuffer(d);
    }
    else {
      reject(new Error('Expected toBlob() to be defined'));
    }
  }));
}


function ipfsRequest (file_name, data) {
  var ipfs = window.IpfsHttpClient('ipfs.infura.io', 5001, {protocol: "https"});
  var file_send =
  [
   {
     path: file_name,
     content: data
   }
 ]
  return new Promise((resolve, reject) => {
      ipfs.add(file_send, function (err, json) {
        if (err) {
          alert(err);
          reject (0)
        } else {
          resolve (json)
        }
      })
  })
}

function add_option(select_id, nft_info, token_id) { 
  let selectElement = document.getElementById(select_id);
  let option = document.createElement("option");
  option.setAttribute("token-id", token_id);
  const text_node = document.createTextNode(token_id);
  option.appendChild(text_node);

  option.setAttribute("value", nft_info.extension.external_url); 
  selectElement.appendChild(option);
}

function reset_select(select_id) {
  let selectElement = document.getElementById(select_id);
  while (selectElement.childNodes.length > 0) {
    selectElement.removeChild(selectElement.lastChild);
  }
}


function get_token_id_from_selector(selector_id) {
  let selector = document.getElementById(selector_id);
  let token_id = selector.options[selector.selectedIndex].getAttribute("token-id");
  return token_id;

}


class TerraClient {


  mint_derivative_nft () {
    let newTokenId = this.token_content + "+" + this.token_style;
    if (this.existing_tokens) {
      for (let i = 0; i < this.existing_tokens.tokens.length; i++) {
        if (this.existing_tokens.tokens[i] == newTokenId) {
          alert(`The derivative token ${newTokenId} already exists. Only unique derivatives are allowed.`);
          return;          
        }
      }
    }

    let mintButton = document.getElementById('mint');
    mintButton.disabled = true;
    let spinner = document.getElementById("mint-spinner");
    spinner.style.display = 'inline-block';

    
  

    let canvas = document.getElementById('stylized');
    canvasToArrayBuffer(canvas).then( (ab) => {
      console.log(ab);
        ipfsRequest("test", new Buffer(new Uint8Array(ab))).then((data) => {
          let hash = data[0].hash;
          let ipfs_url = "https://infura-ipfs.io/ipfs/"+hash;
          console.log("upload complete");
          console.log(ipfs_url);

          this.extension.on('onPost', (result) => {
            let tokenIdSpan = document.getElementById('minted-token-id');
            tokenIdSpan.innerHTML = newTokenId;
            
            if (result.success) {
              new bootstrap.Modal(document.getElementById('exampleModalCenter')).show()
            } else {
              alert("Error occured while minting :(");
            }
            console.log("onPost");
            console.log(result);
            spinner.style.display = 'none';

          });
          let mintMsg = new MsgExecuteContract(this.wallet_address, this.get_contract_address(), 
          {"mint":
            {"token_id": newTokenId, 
            "owner": this.wallet_address, "extension": 
              {"external_url": ipfs_url, "derivative": 
                {"method": "styletransfer", "params" : this.paramstring, "source_ids" : [this.token_content, this.token_style] } 
                } 
              }
          }
                
          );
          
          console.log(mintMsg);

          this.extension.post({
            fee: new StdFee(1000000, '10000000uluna'),
            msgs:[  mintMsg ]});
        }
      );
    
    });

  }


  get_contract_address() {
    return CONTRACT_ADDRESS;
  }

  
  create_nft_callback(token_id) {
    return function(nft_info) { 
      console.log(nft_info);
      add_option('content-select', nft_info, token_id);
      add_option('style-select', nft_info, token_id);
    };
  }


  trigger_change_event (select_id) {
    document.getElementById(select_id).dispatchEvent(new Event('change'));
  }
  
  async retrieve_all_nfts() {
    let nfts = [];

    document.getElementById("content-img").src="images/loading.gif";
    document.getElementById("style-img").src="images/loading.gif";

    
    let canvas = document.getElementById("stylized");
    const context = canvas.getContext('2d');
    context.clearRect(0, 0, canvas.width, canvas.height);

    document.getElementById("mint").disabled=true;

    reset_select('content-select');
    reset_select('style-select');

    let tokens_for_owner = await this.lcd.wasm.contractQuery(this.get_contract_address(), { "tokens": { "owner": this.wallet_address }});
    this.existing_tokens = tokens_for_owner;
    for (let i = 0; i < tokens_for_owner.tokens.length; i ++) {
        //this.lcd.wasm.contractQuery(this.get_contract_address(), {"nft_info":{"token_id":t.tokens[i]}}).then(this.create_nft_callback(t.tokens[i]));
        let token_id = tokens_for_owner.tokens[i];
        let nftInfo = await this.lcd.wasm.contractQuery(this.get_contract_address(), {"nft_info":{"token_id":token_id}});
        console.log(nftInfo);
        add_option('content-select', nftInfo, token_id);
        add_option('style-select', nftInfo, token_id);
    }

    if (tokens_for_owner.tokens.length > 0) {
      this.trigger_change_event('content-select');
      this.trigger_change_event('style-select');  
    } else {
      alert("No NFT issued by on the contract " + this.get_contract_address() + " found!");
    }

    return nfts;
  }




  connect () {
    let spinner = document.getElementById("connect-spinner");
    spinner.style.display = 'inline-block';
    document.getElementById("style-button").disabled = true;

    this.extension.connect();
    this.extension.on("onConnect",  (w) => {
      console.log("connected"); 
      this.wallet_address = w.address;
      this.extension.on('onInfo', async (result) => {
      this.lcd = new LCDClient({
          URL: result.lcd,
          chainID: result.chainID,
        });
    
        await this.retrieve_all_nfts();
        spinner.style.display = 'none';
        document.getElementById("style-button").disabled = false;
        document.getElementById("terra-extension-connect").style.display = 'none';
        document.getElementById("terra-reload").style.display = 'block';
            
      });
      this.extension.info();

    });
  }



  constructor() {
    

    const extension = new Extension();
    this.extension = extension;





      // window.extension.post({
      //   fee: new StdFee(1000000, '10000000uluna'),
      //   msgs:[  

      //     new MsgExecuteContract(window.wallet.address, "terra15nr8gcygpn9pq8urkzcf6hvzzvf0s2qt95hmjw", {"mint":{"token_id":"becca_nakamoto2", "owner":"terra17lmam6zguazs5q5u6z5mmx76uj63gldnse2pdp", "extension": {"external_url": "https://ipfs.infura.io/ipfs/QmYgmfJn1koj2bp2f2ZPHpc44d2b4tqZL7MVPajBnWkxYD", "derivative": {"method": "styletransfer", "source_ids" : ["becca_notices", "vitalik_nakamoto"] } } }}),
      // ]});


      // window.extension.post({
      //   msgs:[          
      //     new MsgSend(window.wallet, "terra1x46rqay4d3cssq8gxxvqz8xt6nwlz4td20k38v", {uluna: 1000000,}),
      // ]});


      //export declare class MsgExecuteContract extends JSONSerializable<MsgExecuteContract.Data> {
      // sender: AccAddress;
      // contract: AccAddress;
      // execute_msg: object;
      // coins: Coins;




      //   export interface CreateTxOptions {
      //     msgs: Msg[];
      //     fee?: StdFee;
      //     memo?: string;
      //     gas?: string;
      //     gasPrices?: Coins.Input;
      //     gasAdjustment?: Numeric.Input;
      //     feeDenoms?: string[];
      //     account_number?: number;
      //     sequence?: number;
      //     timeout_height?: number;
      // }


      // })
      //   {
      //     "chainID": "localterra",
      //     "fcd": "http://localhost:3060",
      //     "lcd": "http://localhost:3060",
      //     "localterra": true,
      //     "name": "localterra"
      // }
   



  }



};


/**
 * Main application to start on window load
 */
class Main {

  constructor() {

    this.reloadButton = document.getElementById('terra-reload');
    this.reloadButton.onclick = async () => {
      document.getElementById("style-button").disabled = true;
      let spinner = document.getElementById("connect-spinner");
      spinner.style.display = 'inline-block';
      this.reloadButton.disabled = true;  
      await this.terraClient.retrieve_all_nfts();      
      this.reloadButton.disabled = false;
      spinner.style.display = 'none';
      document.getElementById("style-button").disabled = false;


    };

    this.terraConnectButton = document.getElementById('terra-extension-connect');
    this.terraConnectButton.onclick = () => {
      let terraClient = new TerraClient();
      this.terraClient = terraClient;
      if (!terraClient.extension.isAvailable) {
        alert("Terra Extension is not available. Please check that you are running Chrome with Terra Extension.")
        return;
      }


      window.terraClient = terraClient;


      this.terraClient.connect();
      this.terraConnectButton.disabled = true;

      
    };



    if (window.mobilecheck()) {
      document.getElementById('mobile-warning').hidden = false;
    }

    this.fileSelect = document.getElementById('file-select');

    // Initialize model selection
    this.modelSelectStyle = document.getElementById('model-select-style');
    this.modelSelectStyle.onchange = (evt) => {
      if (evt.target.value === 'mobilenet') {
        this.disableStylizeButtons();
        this.loadMobileNetStyleModel().then(model => {
          this.styleNet = model;
        }).finally(() => this.enableStylizeButtons());
      } else if (evt.target.value === 'inception') {
        this.disableStylizeButtons();
        this.loadInceptionStyleModel().then(model => {
          this.styleNet = model;
        }).finally(() => this.enableStylizeButtons());
      }
    }

    this.modelSelectTransformer = document.getElementById('model-select-transformer');
    this.modelSelectTransformer.onchange = (evt) => {
      if (evt.target.value === 'original') {
        this.disableStylizeButtons();
        this.loadOriginalTransformerModel().then(model => {
          this.transformNet = model;
        }).finally(() => this.enableStylizeButtons());
      } else if (evt.target.value === 'separable') {
        this.disableStylizeButtons();
        this.loadSeparableTransformerModel().then(model => {
          this.transformNet = model;
        }).finally(() => this.enableStylizeButtons());
      }
    }

    this.initalizeWebcamVariables();
    this.initializeStyleTransfer();
    //this.initializeCombineStyles();

    Promise.all([
      this.loadMobileNetStyleModel(),
      this.loadSeparableTransformerModel(),
    ]).then(([styleNet, transformNet]) => {
      console.log('Loaded styleNet');
      this.styleNet = styleNet;
      this.transformNet = transformNet;
      this.enableStylizeButtons()
    });
  }

  async loadMobileNetStyleModel() {
    if (!this.mobileStyleNet) {
      this.mobileStyleNet = await tf.loadGraphModel(
        'saved_model_style_js/model.json');
    }

    return this.mobileStyleNet;
  }

  async loadInceptionStyleModel() {
    if (!this.inceptionStyleNet) {
      this.inceptionStyleNet = await tf.loadGraphModel(
        'saved_model_style_inception_js/model.json');
    }

    return this.inceptionStyleNet;
  }

  async loadOriginalTransformerModel() {
    if (!this.originalTransformNet) {
      this.originalTransformNet = await tf.loadGraphModel(
        'saved_model_transformer_js/model.json'
      );
    }

    return this.originalTransformNet;
  }

  async loadSeparableTransformerModel() {
    if (!this.separableTransformNet) {
      this.separableTransformNet = await tf.loadGraphModel(
        'saved_model_transformer_separable_js/model.json'
      );
    }

    return this.separableTransformNet;
  }

  initalizeWebcamVariables() {
    this.camModal = $('#cam-modal');

    this.snapButton = document.getElementById('snap-button');
    this.webcamVideoElement = document.getElementById('webcam-video');

    navigator.getUserMedia = navigator.getUserMedia ||
      navigator.webkitGetUserMedia || navigator.mozGetUserMedia ||
      navigator.msGetUserMedia;

    this.camModal.on('hidden.bs.modal', () => {
      this.stream.getTracks()[0].stop();
    })

    this.camModal.on('shown.bs.modal', () => {
      navigator.getUserMedia(
        {
          video: true
        },
        (stream) => {
          this.stream = stream;
          this.webcamVideoElement.srcObject = stream;
          this.webcamVideoElement.play();
        },
        (err) => {
          console.error(err);
        }
      );
    })
  }

  openModal(element) {
    this.camModal.modal('show');
    this.snapButton.onclick = () => {
      const hiddenCanvas = document.getElementById('hidden-canvas');
      const hiddenContext = hiddenCanvas.getContext('2d');
      hiddenCanvas.width = this.webcamVideoElement.width;
      hiddenCanvas.height = this.webcamVideoElement.height;
      hiddenContext.drawImage(this.webcamVideoElement, 0, 0,
        hiddenCanvas.width, hiddenCanvas.height);
      const imageDataURL = hiddenCanvas.toDataURL('image/jpg');
      element.src = imageDataURL;
      this.camModal.modal('hide');
    };
  }

  initializeStyleTransfer() {
    // Initialize images
    this.contentImg = document.getElementById('content-img');
    this.contentImg.onerror = () => {
      alert("Error loading " + this.contentImg.src + ".");
    }
    this.styleImg = document.getElementById('style-img');
    this.styleImg.onerror = () => {
      alert("Error loading " + this.styleImg.src + ".");
    }
    this.stylized = document.getElementById('stylized');

    // Initialize images
    this.contentImgSlider = document.getElementById('content-img-size');
    this.connectImageAndSizeSlider(this.contentImg, this.contentImgSlider);
    this.styleImgSlider = document.getElementById('style-img-size');
    // this.styleImgSquare = document.getElementById('style-img-square');
    this.connectImageAndSizeSlider(this.styleImg, this.styleImgSlider, this.styleImgSquare);

    this.styleRatio = 1.0
    this.styleRatioSlider = document.getElementById('stylized-img-ratio');
    this.styleRatioSlider.oninput = (evt) => {
      this.styleRatio = evt.target.value / 100.;
    }

    // Initialize buttons

    this.terraMintButton = document.getElementById('mint');
    this.terraMintButton.onclick = () => {
      this.terraClient.mint_derivative_nft();
      this.terraMintButton.disabled = true;
    };

    this.styleButton = document.getElementById('style-button');
    this.styleButton.onclick = () => {
      this.disableStylizeButtons();
      this.startStyling().finally(() => {
        this.enableStylizeButtons();
        this.terraMintButton.disabled = !this.terraConnectButton.disabled;

      });
    };
    // this.randomizeButton = document.getElementById('randomize');
    // this.randomizeButton.onclick = () => {
    //   this.styleRatioSlider.value = getRndInteger(0, 100);
    //   this.contentImgSlider.value = getRndInteger(256, 400);
    //   this.styleImgSlider.value = getRndInteger(100, 400);
    //   this.styleRatioSlider.dispatchEvent(new Event("input"));
    //   this.contentImgSlider.dispatchEvent(new Event("input"));
    //   this.styleImgSlider.dispatchEvent(new Event("input"));
    //   if (getRndInteger(0, 1)) {
    //     this.styleImgSquare.click();
    //   }
    // }

    // Initialize selectors
    this.contentSelect = document.getElementById('content-select');
    this.contentSelect.onchange = (evt) => this.setImage(this.contentImg, evt.target.value);
    //this.contentSelect.onclick = () => this.contentSelect.value = '';
    this.styleSelect = document.getElementById('style-select');
    this.styleSelect.onchange = (evt) => this.setImage(this.styleImg, evt.target.value);
    //this.styleSelect.onclick = () => this.styleSelect.value = '';
  }

  // initializeCombineStyles() {
  //   // Initialize images
  //   this.combContentImg = document.getElementById('c-content-img');
  //   this.combContentImg.onerror = () => {
  //     alert("Error loading " + this.combContentImg.src + ".");
  //   }
  //   this.combStyleImg1 = document.getElementById('c-style-img-1');
  //   this.combStyleImg1.onerror = () => {
  //     alert("Error loading " + this.combStyleImg1.src + ".");
  //   }
  //   this.combStyleImg2 = document.getElementById('c-style-img-2');
  //   this.combStyleImg2.onerror = () => {
  //     alert("Error loading " + this.combStyleImg2.src + ".");
  //   }
  //   this.combStylized = document.getElementById('c-stylized');

  //   // Initialize images
  //   this.combContentImgSlider = document.getElementById('c-content-img-size');
  //   this.connectImageAndSizeSlider(this.combContentImg, this.combContentImgSlider);
  //   this.combStyleImg1Slider = document.getElementById('c-style-img-1-size');
  //   this.combStyleImg1Square = document.getElementById('c-style-1-square');
  //   this.connectImageAndSizeSlider(this.combStyleImg1, this.combStyleImg1Slider, this.combStyleImg1Square);
  //   this.combStyleImg2Slider = document.getElementById('c-style-img-2-size');
  //   this.combStyleImg2Square = document.getElementById('c-style-2-square');
  //   this.connectImageAndSizeSlider(this.combStyleImg2, this.combStyleImg2Slider, this.combStyleImg2Square);

  //   this.combStyleRatio = 0.5
  //   this.combStyleRatioSlider = document.getElementById('c-stylized-img-ratio');
  //   this.combStyleRatioSlider.oninput = (evt) => {
  //     this.combStyleRatio = evt.target.value/100.;
  //   }

  //   // Initialize buttons
  //   this.combineButton = document.getElementById('combine-button');
  //   this.combineButton.onclick = () => {
  //     this.disableStylizeButtons();
  //     this.startCombining().finally(() => {
  //       this.enableStylizeButtons();
  //     });
  //   };
  //   this.combRandomizeButton = document.getElementById('c-randomize');
  //   this.combRandomizeButton.onclick = () => {
  //     this.combContentImgSlider.value = getRndInteger(256, 400);
  //     this.combStyleImg1Slider.value = getRndInteger(100, 400);
  //     this.combStyleImg2Slider.value = getRndInteger(100, 400);
  //     this.combStyleRatioSlider.value = getRndInteger(0, 100);
  //     this.combContentImgSlider.dispatchEvent(new Event("input"));
  //     this.combStyleImg1Slider.dispatchEvent(new Event("input"));
  //     this.combStyleImg2Slider.dispatchEvent(new Event("input"));
  //     this.combStyleRatioSlider.dispatchEvent(new Event("input"));
  //     if (getRndInteger(0, 1)) {
  //       this.combStyleImg1Square.click();
  //     }
  //     if (getRndInteger(0, 1)) {
  //       this.combStyleImg2Square.click();
  //     }
  //   }

  //   // Initialize selectors
  //   this.combContentSelect = document.getElementById('c-content-select');
  //   this.combContentSelect.onchange = (evt) => this.setImage(this.combContentImg, evt.target.value);
  //   this.combContentSelect.onclick = () => this.combContentSelect.value = '';
  //   this.combStyle1Select = document.getElementById('c-style-1-select');
  //   this.combStyle1Select.onchange = (evt) => this.setImage(this.combStyleImg1, evt.target.value);
  //   this.combStyle1Select.onclick = () => this.combStyle1Select.value = '';
  //   this.combStyle2Select = document.getElementById('c-style-2-select');
  //   this.combStyle2Select.onchange = (evt) => this.setImage(this.combStyleImg2, evt.target.value);
  //   this.combStyle2Select.onclick = () => this.combStyle2Select.value = '';
  // }

  connectImageAndSizeSlider(img, slider, square) {
    slider.oninput = (evt) => {
      img.height = evt.target.value;
      if (img.style.width) {
        // If this branch is triggered, then that means the image was forced to a square using
        // a fixed pixel value.
        img.style.width = img.height + "px";  // Fix width back to a square
      }
    }
    if (square !== undefined) {
      square.onclick = (evt) => {
        if (evt.target.checked) {
          img.style.width = img.height + "px";
        } else {
          img.style.width = '';
        }
      }
    }
  }

  // Helper function for setting an image
  setImage(element, selectedValue) {
    if (selectedValue === 'file') {
      console.log('file selected');
      this.fileSelect.onchange = (evt) => {
        const f = evt.target.files[0];
        const fileReader = new FileReader();
        fileReader.onload = ((e) => {
          element.src = e.target.result;
        });
        fileReader.readAsDataURL(f);
        this.fileSelect.value = '';
      }
      this.fileSelect.click();
    } else if (selectedValue === 'pic') {
      this.openModal(element);
    } else if (selectedValue === 'random') {
      const randomNumber = Math.floor(Math.random() * links.length);
      element.src = links[randomNumber];
    } else if (selectedValue.startsWith("http")) {
      element.src = selectedValue;
    } else {
      element.src = 'images/' + selectedValue + '.jpg';
    }
  }

  enableStylizeButtons() {
    this.styleButton.disabled = false;
    //this.combineButton.disabled = false;
    this.modelSelectStyle.disabled = false;
    this.modelSelectTransformer.disabled = false;
    this.styleButton.textContent = 'Stylize';
    //this.combineButton.textContent = 'Combine Styles';
  }

  disableStylizeButtons() {
    this.styleButton.disabled = true;
    //this.combineButton.disabled = true;
    this.modelSelectStyle.disabled = true;
    this.modelSelectTransformer.disabled = true;
  }

  async startStyling() {
    await tf.nextFrame();
    this.styleButton.textContent = 'Generating 100D style representation';
    await tf.nextFrame();
    let bottleneck = await tf.tidy(() => {
      return this.styleNet.predict(tf.browser.fromPixels(this.styleImg).toFloat().div(tf.scalar(255)).expandDims());
    })
    if (this.styleRatio !== 1.0) {
      this.styleButton.textContent = 'Generating 100D identity style representation';
      await tf.nextFrame();
      const identityBottleneck = await tf.tidy(() => {
        return this.styleNet.predict(tf.browser.fromPixels(this.contentImg).toFloat().div(tf.scalar(255)).expandDims());
      })
      const styleBottleneck = bottleneck;
      bottleneck = await tf.tidy(() => {
        const styleBottleneckScaled = styleBottleneck.mul(tf.scalar(this.styleRatio));
        const identityBottleneckScaled = identityBottleneck.mul(tf.scalar(1.0 - this.styleRatio));
        return styleBottleneckScaled.addStrict(identityBottleneckScaled)
      })
      styleBottleneck.dispose();
      identityBottleneck.dispose();
    }
    this.styleButton.textContent = 'Stylizing image...';
    await tf.nextFrame();
    const stylized = await tf.tidy(() => {
      return this.transformNet.predict([tf.browser.fromPixels(this.contentImg).toFloat().div(tf.scalar(255)).expandDims(), bottleneck]).squeeze();
    })
    await tf.browser.toPixels(stylized, this.stylized);
    bottleneck.dispose();  // Might wanna keep this around
    stylized.dispose();

    if (this.terraClient) {
      let content_height = document.getElementById("content-img").getAttribute("height");
      let style_height = document.getElementById("style-img").getAttribute("height");
      let ratio = document.getElementById('stylized-img-ratio').value;          
      let style = document.getElementById('model-select-style').value;
      let transformer = document.getElementById('model-select-transformer').value;
  
      this.terraClient.paramstring =`${style}:${transformer}:${ratio}:${content_height}:${style_height}`;

      this.terraClient.token_content = get_token_id_from_selector("content-select");
      this.terraClient.token_style = get_token_id_from_selector("style-select");  
    }

  }

  async startCombining() {
    await tf.nextFrame();
    //this.combineButton.textContent = 'Generating 100D style representation of image 1';
    await tf.nextFrame();
    const bottleneck1 = await tf.tidy(() => {
      return this.styleNet.predict(tf.browser.fromPixels(this.combStyleImg1).toFloat().div(tf.scalar(255)).expandDims());
    })

    //this.combineButton.textContent = 'Generating 100D style representation of image 2';
    await tf.nextFrame();
    const bottleneck2 = await tf.tidy(() => {
      return this.styleNet.predict(tf.browser.fromPixels(this.combStyleImg2).toFloat().div(tf.scalar(255)).expandDims());
    });

    //this.combineButton.textContent = 'Stylizing image...';
    await tf.nextFrame();
    const combinedBottleneck = await tf.tidy(() => {
      const scaledBottleneck1 = bottleneck1.mul(tf.scalar(1 - this.combStyleRatio));
      const scaledBottleneck2 = bottleneck2.mul(tf.scalar(this.combStyleRatio));
      return scaledBottleneck1.addStrict(scaledBottleneck2);
    });

    const stylized = await tf.tidy(() => {
      return this.transformNet.predict([tf.browser.fromPixels(this.combContentImg).toFloat().div(tf.scalar(255)).expandDims(), combinedBottleneck]).squeeze();
    })
    await tf.browser.toPixels(stylized, this.combStylized);
    bottleneck1.dispose();  // Might wanna keep this around
    bottleneck2.dispose();
    combinedBottleneck.dispose();
    stylized.dispose();
  }

  async benchmark() {
    const x = tf.randomNormal([1, 256, 256, 3]);
    const bottleneck = tf.randomNormal([1, 1, 1, 100]);

    let styleNet = await this.loadInceptionStyleModel();
    let time = await this.benchmarkStyle(x, styleNet);
    styleNet.dispose();

    styleNet = await this.loadMobileNetStyleModel();
    time = await this.benchmarkStyle(x, styleNet);
    styleNet.dispose();

    let transformNet = await this.loadOriginalTransformerModel();
    time = await this.benchmarkTransform(
      x, bottleneck, transformNet);
    transformNet.dispose();

    transformNet = await this.loadSeparableTransformerModel();
    time = await this.benchmarkTransform(
      x, bottleneck, transformNet);
    transformNet.dispose();

    x.dispose();
    bottleneck.dispose();
  }

  async benchmarkStyle(x, styleNet) {
    const profile = await tf.profile(() => {
      tf.tidy(() => {
        const dummyOut = styleNet.predict(x);
        dummyOut.print();
      });
    });
    console.log(profile);
    const time = await tf.time(() => {
      tf.tidy(() => {
        for (let i = 0; i < 10; i++) {
          const y = styleNet.predict(x);
          y.print();
        }
      })
    });
    console.log(time);
  }

  async benchmarkTransform(x, bottleneck, transformNet) {
    const profile = await tf.profile(() => {
      tf.tidy(() => {
        const dummyOut = transformNet.predict([x, bottleneck]);
        dummyOut.print();
      });
    });
    console.log(profile);
    const time = await tf.time(() => {
      tf.tidy(() => {
        for (let i = 0; i < 10; i++) {
          const y = transformNet.predict([x, bottleneck]);
          y.print();
        }
      })
    });
    console.log(time);
  }
}

function getRndInteger(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

window.mobilecheck = function () {
  var check = false;
  (function (a) { if (/(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|iris|kindle|lge |maemo|midp|mmp|mobile.+firefox|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows ce|xda|xiino/i.test(a) || /1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s\-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|\-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw\-(n|u)|c55\/|capi|ccwa|cdm\-|cell|chtm|cldc|cmd\-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc\-s|devi|dica|dmob|do(c|p)o|ds(12|\-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(\-|_)|g1 u|g560|gene|gf\-5|g\-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd\-(m|p|t)|hei\-|hi(pt|ta)|hp( i|ip)|hs\-c|ht(c(\-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i\-(20|go|ma)|i230|iac( |\-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc\-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|\-[a-w])|libw|lynx|m1\-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m\-cr|me(rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(\-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)\-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|\-([1-8]|c))|phil|pire|pl(ay|uc)|pn\-2|po(ck|rt|se)|prox|psio|pt\-g|qa\-a|qc(07|12|21|32|60|\-[2-7]|i\-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h\-|oo|p\-)|sdk\/|se(c(\-|0|1)|47|mc|nd|ri)|sgh\-|shar|sie(\-|m)|sk\-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h\-|v\-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl\-|tdg\-|tel(i|m)|tim\-|t\-mo|to(pl|sh)|ts(70|m\-|m3|m5)|tx\-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|\-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(\-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas\-|your|zeto|zte\-/i.test(a.substr(0, 4))) check = true; })(navigator.userAgent || navigator.vendor || window.opera);
  return check;
};
window.addEventListener('load', () => new Main());
