#!/bin/bash
source ./helper_tools.sh

dockerHubAccount=$DOCKERHUB_USERNAME
scriptDirectory=$(get_relative_path_of_script_directory)
backendTagName=interview-example-project-backend
backendFolder=$scriptDirectory/../backend
pomFile=$backendFolder/pom.xml
projectBackendVersion="$(cat "$pomFile" | grep "<project.version>" | grep -Eo "[0-9]+.[0-9]+.[0-9]+")"
backendDockerFile=$backendFolder/Dockerfile


create_backend_docker_file() {
    cd "$scriptDirectory"/../backend || exit 1
    echo "Prepare backend Dockerfile for production..."
    replaceText "{project_version}" "$projectBackendVersion" "$backendDockerFile"
    echo "Dockerfile preparation successful!"

    echo "Building docker image..."
    docker build -t $backendTagName:"$projectBackendVersion" -t $backendTagName:latest .
    echo "Docker image build successful..."
    echo "Tagging backend image..."
    docker tag $backendTagName:"$projectBackendVersion" $dockerHubAccount/$backendTagName:"$projectBackendVersion"
    docker tag $backendTagName:"$projectBackendVersion" $dockerHubAccount/$backendTagName:latest
    echo "Tagging successful"
    echo "Pushing backend image to docker hub..."
    docker push $dockerHubAccount/$backendTagName:"$projectBackendVersion"
    docker push $dockerHubAccount/$backendTagName:latest
    echo "Push successful"
    cd "$scriptDirectory" || exit 1
}

create_backend_docker_file
