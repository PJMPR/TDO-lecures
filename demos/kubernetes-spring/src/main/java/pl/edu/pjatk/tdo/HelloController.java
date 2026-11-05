package pl.edu.pjatk.tdo;

import java.time.Instant;
import java.util.Map;
import java.util.concurrent.atomic.AtomicLong;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api")
class HelloController {
    private final AtomicLong requests = new AtomicLong();
    private final String message;
    private final String podName;
    private final String version;

    HelloController(@Value("${app.message:Witaj z Kubernetes!}") String message,
                    @Value("${POD_NAME:local}") String podName,
                    @Value("${APP_VERSION:dev}") String version) {
        this.message = message;
        this.podName = podName;
        this.version = version;
    }

    @GetMapping("/hello")
    Map<String, Object> hello() {
        return Map.of("message", message, "pod", podName, "version", version,
                "request", requests.incrementAndGet(), "time", Instant.now().toString());
    }
}
