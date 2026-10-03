CREATE TABLE missions (
  id BIGSERIAL PRIMARY KEY,
  name VARCHAR(120) NOT NULL,
  status VARCHAR(30) NOT NULL,
  launch_date DATE
);
INSERT INTO missions(name,status,launch_date) VALUES
 ('Orbital Relay','PLANNED','2027-03-12'),
 ('Europa Survey','READY','2027-06-01');

