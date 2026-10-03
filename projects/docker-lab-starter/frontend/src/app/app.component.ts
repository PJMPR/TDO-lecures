import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';

interface Mission { id:number; name:string; status:string; launchDate:string|null; }
@Component({selector:'app-root',standalone:true,imports:[CommonModule,FormsModule],templateUrl:'./app.component.html'})
export class AppComponent implements OnInit {
 private readonly http=inject(HttpClient); missions:Mission[]=[]; name=''; status='PLANNED'; launchDate=''; error='';
 ngOnInit(){this.load();}
 load(){this.http.get<Mission[]>('/api/missions').subscribe({next:data=>{this.missions=data;this.error='';},error:()=>this.error='Nie udało się połączyć z API.'});}
 add(){if(!this.name.trim())return;this.http.post<Mission>('/api/missions',{name:this.name,status:this.status,launchDate:this.launchDate||null}).subscribe({next:()=>{this.name='';this.launchDate='';this.load();},error:()=>this.error='Nie udało się zapisać misji.'});}
 remove(id:number){this.http.delete('/api/missions/'+id).subscribe({next:()=>this.load(),error:()=>this.error='Nie udało się usunąć misji.'});}
}

