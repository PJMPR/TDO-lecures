package pl.edu.pjatk.tdo.mission;

import jakarta.persistence.*;
import java.time.LocalDate;

@Entity
@Table(name = "missions")
public class Mission {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @Column(nullable = false, length = 120)
    private String name;
    @Column(nullable = false, length = 30)
    private String status;
    @Column(name = "launch_date")
    private LocalDate launchDate;

    protected Mission() {}
    public Mission(String name, String status, LocalDate launchDate) { this.name=name; this.status=status; this.launchDate=launchDate; }
    public Long getId(){return id;} public String getName(){return name;} public void setName(String name){this.name=name;}
    public String getStatus(){return status;} public void setStatus(String status){this.status=status;}
    public LocalDate getLaunchDate(){return launchDate;} public void setLaunchDate(LocalDate launchDate){this.launchDate=launchDate;}
}

