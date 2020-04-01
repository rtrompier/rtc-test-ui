import { Injectable } from '@angular/core';
import * as io from 'socket.io-client';

@Injectable({providedIn: 'root'})
export class SocketService {
  public socket = io('http://rtc.remy-trompier.ch:4000');

  constructor() {}


}
