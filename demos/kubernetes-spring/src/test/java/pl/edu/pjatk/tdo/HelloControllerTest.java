package pl.edu.pjatk.tdo;

import static org.hamcrest.Matchers.is;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.web.servlet.MockMvc;

@SpringBootTest(properties = {"app.message=Test", "POD_NAME=test-pod", "APP_VERSION=test"})
@AutoConfigureMockMvc
class HelloControllerTest {
    @Autowired MockMvc mvc;

    @Test
    void returnsPodIdentityAndConfiguration() throws Exception {
        mvc.perform(get("/api/hello")).andExpect(status().isOk())
                .andExpect(jsonPath("$.message", is("Test")))
                .andExpect(jsonPath("$.pod", is("test-pod")))
                .andExpect(jsonPath("$.version", is("test")));
    }
}
