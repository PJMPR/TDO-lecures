package pl.edu.pjatk.tdo.mission;

import java.time.LocalDate;

public record MissionRequest(String name, String status, LocalDate launchDate) {}

