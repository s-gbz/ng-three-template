import {Component, OnInit} from '@angular/core';
import { EngineService } from 'src/app/engine/engine.service';

@Component({
  selector: 'app-ui-infobar-bottom',
  templateUrl: './ui-infobar-bottom.component.html'
})
export class UiInfobarBottomComponent implements OnInit {

  public constructor(private engServ: EngineService) { }

  public ngOnInit(): void {
  }

  printText(newText: string) {
    this.engServ.createTextWithTextGeometry(newText);
  }

}
