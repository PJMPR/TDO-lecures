FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /src
COPY NuGet.Config Directory.Build.props Directory.Build.targets ./
COPY backend/MissionControl.Api.csproj backend/packages.lock.json backend/
RUN dotnet restore backend/MissionControl.Api.csproj --locked-mode
COPY backend/ backend/
RUN dotnet publish backend/MissionControl.Api.csproj --configuration Release --no-restore --output /app/publish

FROM mcr.microsoft.com/dotnet/aspnet:10.0
USER root
RUN apt-get update \
    && apt-get install -y --no-install-recommends curl \
    && rm -rf /var/lib/apt/lists/*
WORKDIR /app
COPY --from=build /app/publish .
ENV ASPNETCORE_URLS=http://+:8080
EXPOSE 8080
USER $APP_UID
ENTRYPOINT ["dotnet", "MissionControl.Api.dll"]
