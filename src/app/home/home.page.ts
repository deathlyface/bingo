import { Component } from '@angular/core';
import { Location } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { AngularFireDatabase } from '@angular/fire/database';
import { AlertController } from '@ionic/angular';
import { NgNavigatorShareService } from 'ng-navigator-share';

// 0  1  2  3  4
// 5  6  7  8  9
// 10 11 X  12 13
// 14 15 16 17 18
// 19 20 21 22 23

var winCombinations = [
  [0, 1, 2, 3, 4],
  [5, 6, 7, 8, 9],
  [10, 11, 12, 13],
  [14, 15, 16, 17, 18],
  [19, 20, 21, 22, 23],
  [0, 5, 10, 14, 19],
  [1, 6, 11, 15, 20],
  [2, 7, 16, 21],
  [3, 8, 12, 17, 22],
  [4, 9, 13, 18, 23],
  [0, 6, 17, 23],
  [4, 8, 15, 19]
]

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
})
export class HomePage {
  text: object = {}
  count: number = 0
  randNum: number[] = []
  clicked: boolean[] = []
  alertDisplayed: boolean = false

  constructor(
    private location: Location,
    private route: ActivatedRoute,
    private db: AngularFireDatabase,
    private alertController: AlertController,
    private ngNavigatorShareService: NgNavigatorShareService
  ) {
    this.ngNavigatorShareService = ngNavigatorShareService
    if (route.snapshot.queryParamMap.get("0")){
      this.prefilled()
    } else {
      this.getStatement()
    }
  }

  prefilled(){
    this.reset()
    try {
      for (var x = 0; x < 24; x++) {
        this.randNum.push(parseInt(this.route.snapshot.queryParamMap.get(x.toString())))
      }
      this.getText(this.randNum)
    } catch (error) {
      // Error, use random statement
      this.reset()
      this.getStatement()
    }
  }

  generateNum(count: number) {
    var numList = []
    while (numList.length != 24) {
      var randNum = Math.floor(Math.random() * Math.floor(count))
      if (numList.indexOf(randNum) == -1) {
        numList.push(randNum)
      }
    }
    this.randNum = numList
    this.setPath()

    return numList
  }

  setPath() {
    var param = "?"
    this.randNum.forEach((index) => {
      param = param + this.randNum.indexOf(index) + "=" + index + "&"
    })
    this.location.go(param)
  }

  getStatement() {
    this.db.database.ref('count').once('value').then((val) => {
      this.count = val.val()
    }).then(() => {
      this.getText(this.generateNum(this.count))
    })
  }

  getText(indices: number[]) {
    indices.forEach((index) => {
      this.db.database.ref('text/' + index).once('value').then((val) => {
        this.text[index] = val.val()
      })
    })
  }

  getTextFromIndex(index: number) {
    if (this.text[this.randNum[index]]) {
      return this.text[this.randNum[index]]
    } else {
      return "Loading"
    }
  }

  click(index: number) {
    if (this.clicked.length == 0) {
      for (var x = 0; x < 24; x++) {
        this.clicked.push(false)
      }
    }
    this.clicked[index] = !this.clicked[index]

    this.checkWin()
  }

  checkWin() {
    var win = 0
    winCombinations.forEach((combination) => {
      var win2 = 0
      combination.forEach((index) => {
        if (this.clicked[index] == true) {
          win2++
        }
      })
      if (win2 == combination.length) {
        win++
      }
    })
    if (win && !this.alertDisplayed) {
      this.alertWin()
    }
  }

  async alertWin() {
    this.confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 }
    });

    const alert = await this.alertController.create({
      header: 'You Win!',
      message: 'Congratulations! Now share this website to your fellow coders.',
      buttons: [
        {
          text: 'Back',
          role: 'cancel'
        },
        {
          text: 'Reset',
          handler: () => {
            this.reset()
          }
        },
        {
          text: 'Play Again',
          handler: () => {
            this.new()
          }
        }
      ]
    });

    this.alertDisplayed = true

    await alert.present();
  }

  getColor(index: number) {
    if (this.clicked[index] == true) {
      return "#777"
    } else {
      return "transparent"
    }
  }

  confetti(args: any) {
    return window['confetti'].apply(this, arguments);
  }

  reset() {
    this.clicked = []
    this.alertDisplayed = false
  }

  new(){
    this.reset()
    this.getStatement()
  }

  share(){
    this.ngNavigatorShareService.share({
      title: "Programming Bingo",
      text: "Hey! Are you a programmer? Check this bingo made for programmers!",
      url: "https://bingo.deathlyf.com/" + this.location.path()
    })
  }

}
