import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { SocketService } from './socket.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {

  public videoStreams = this.socketService.videoStreams;

  @ViewChild('video') public video: ElementRef;
  @ViewChild('videoClient') public video2: ElementRef;

  constructor(private socketService: SocketService) { }

  public ngOnInit() {

    this.socketService.initConnection();
  }

}
