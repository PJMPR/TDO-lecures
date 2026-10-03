package pl.edu.pjatk.tdo.mission;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/missions")
public class MissionController {
    private final MissionRepository repository;
    public MissionController(MissionRepository repository){this.repository=repository;}

    @GetMapping public List<Mission> all(){return repository.findAll();}
    @GetMapping("/{id}") public Mission one(@PathVariable Long id){return repository.findById(id).orElseThrow(MissionNotFoundException::new);}
    @PostMapping @ResponseStatus(HttpStatus.CREATED)
    public Mission create(@RequestBody MissionRequest request){return repository.save(new Mission(request.name(), request.status(), request.launchDate()));}
    @PutMapping("/{id}") public Mission update(@PathVariable Long id,@RequestBody MissionRequest request){
        Mission mission=repository.findById(id).orElseThrow(MissionNotFoundException::new);
        mission.setName(request.name()); mission.setStatus(request.status()); mission.setLaunchDate(request.launchDate());
        return repository.save(mission);
    }
    @DeleteMapping("/{id}") @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable Long id){if(!repository.existsById(id))throw new MissionNotFoundException();repository.deleteById(id);}
    @ResponseStatus(HttpStatus.NOT_FOUND) static class MissionNotFoundException extends RuntimeException {}
}

