import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { SocketService } from './socket.service';
import { ActivatedRoute } from '@angular/router';

@Component({
    selector: 'app-root',
    templateUrl: './app.component.html',
    styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {
    // private peerConnections = [];
    // public peerConnection: any;

    public clients: string[];

    @ViewChild('myVideo') public myVideo: ElementRef;

    constructor(
        private socketService: SocketService
    ) {
        window.onunload = window.onbeforeunload = () => {
            this.socketService.socket.close();
        };
    }

    public ngOnInit() {

        this.socketService.clients$.subscribe((clients) => {
            this.clients = clients;
        });

        if (window.location.search) {
            console.log('is only viewer');
            // Init the socket, and share with other participants
            this.socketService.init(false);
            return;
        }

        navigator.mediaDevices.getUserMedia({
            video: true,
            audio: false,
        })
            .then((stream) => {
                this.myVideo.nativeElement.srcObject = stream;

                // Add all track inside the connection
                stream.getTracks().forEach((track) => this.socketService.addStream(track, stream));

                // Init the socket, and share with other participants
                this.socketService.init(true);

            }).catch(error => console.error(error));
    }

}
