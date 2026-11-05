# Hello Kubernetes — Spring Boot + Rancher Desktop

Minimalna aplikacja pokazuje ConfigMap, nazwę obsługującego Poda, rollout, self-healing i skalowanie. Wymaga JDK 21, Maven, Rancher Desktop z włączonym Kubernetes oraz kubectl.

## 1. Sprawdź środowisko

W Rancher Desktop włącz Kubernetes. Najprostsza ścieżka używa runtime **dockerd (moby)**.

~~~powershell
kubectl config current-context
kubectl get nodes
docker version
~~~

## 2. Test i obraz

~~~powershell
cd demos/kubernetes-spring
mvn clean verify
docker build -t hello-k8s:1.0.0 .
docker image inspect hello-k8s:1.0.0
~~~

Dla runtime **containerd** użyj: `nerdctl --namespace k8s.io build -t hello-k8s:1.0.0 .`

Manifest ma `imagePullPolicy: Never`, więc obraz musi istnieć w lokalnym runtime Kubernetes.

## 3. Wdróż i sprawdź

~~~powershell
kubectl apply -f k8s
kubectl rollout status deployment/hello-k8s -n k8s-demo
kubectl get all -n k8s-demo
kubectl get ingress -n k8s-demo
~~~

## 4. Najpewniejszy dostęp: port-forward

~~~powershell
kubectl port-forward -n k8s-demo service/hello-k8s 8080:80
~~~

W drugim terminalu:

~~~powershell
curl.exe http://localhost:8080/api/hello
curl.exe http://localhost:8080/actuator/health
~~~

## 5. Eksperymenty

~~~powershell
kubectl get pods -n k8s-demo -w
kubectl scale deployment/hello-k8s -n k8s-demo --replicas=3
kubectl logs -n k8s-demo deployment/hello-k8s
kubectl describe deployment hello-k8s -n k8s-demo
kubectl delete pod -n k8s-demo POD_NAME
~~~

Po usunięciu Poda Deployment automatycznie utworzy następcę.

## 6. Ingress (opcjonalnie)

Ingress wymaga kontrolera:

~~~powershell
kubectl get ingressclass
kubectl get pods -A | Select-String traefik
curl.exe -H "Host: hello.local" http://127.0.0.1/api/hello
~~~

Dostępny port zależy od ustawień Rancher Desktop; port-forward działa niezależnie. Aby użyć przeglądarki, dopisz z prawami administratora `127.0.0.1 hello.local` do `C:\Windows\System32\drivers\etc\hosts`.

## 7. Sprzątanie

~~~powershell
kubectl delete namespace k8s-demo
docker image rm hello-k8s:1.0.0
~~~

Usunięcie namespace usuwa wszystkie zasoby demo. Obraz pozostaje lokalnie, dopóki nie usuniesz go osobno.

