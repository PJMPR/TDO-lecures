package pl.edu.pjatk.tdo.mission;

import org.junit.jupiter.api.Test;
import java.time.LocalDate;
import static org.assertj.core.api.Assertions.assertThat;

class MissionRequestTest {
 @Test void storesPayload(){var request=new MissionRequest("Test","READY",LocalDate.of(2027,1,1));assertThat(request.name()).isEqualTo("Test");}
}

