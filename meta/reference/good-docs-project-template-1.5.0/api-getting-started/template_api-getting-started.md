# {Product} API getting started guide

{For information about filling in this template, see the accompanying [[API getting started user guide](https://docs.google.com/document/d/1f-_BL2MhfzgoStdEmECw3VMTknFTGkkRavzw4jNFBTQ/edit#heading=h.hsi0enkkga6)].}

{This template includes writing instructions and boilerplate text so that you can customize the API [getting started user guide](https://docs.google.com/document/d/1f-_BL2MhfzgoStdEmECw3VMTknFTGkkRavzw4jNFBTQ/edit#heading=h.hsi0enkkga6), use it as-is, or completely replace it with your own text. This text is indicated in {curly brackets}. Make sure you delete or replace the content in the curly brackets with your own text.}

This guide walks you through getting started with the {name of your product} API to {explain what the user will do or accomplish in the guide, such as making GET or POST requests, using the API to create an app, and so on}.

By the end of this guide, you will be able to:

* {Objective 1}  
* {Objective 2}  
* {Objective 3}

## Prerequisites

Before you begin, ensure you:

* Are familiar with {explain the relevant concepts or experience the user needs to have to use the API, such as the REST API experience}.  
* Have the following tools installed or set up:  
  * {Software Prerequisite 1}  
  * {Software Prerequisite 2}

## Authentication

Making a request to the {product name} API requires authentication. Follow these steps to access to the API:

1. {Sign up for an account}  
2. {Request for an API key}  
3. {Additional steps as necessary}

## Base URL

The base URL for all requests to the API is:

```text
{https://api.example.com/v2}
```

## Make your first API request

This section demonstrates how to make your first API request to the {product name} API.   
To make your first API request:

1. Select an API endpoint. See the API reference document for a list of endpoints.  
2. Use cURL or Postman to make a request.

### Request

The following is a sample POST request that sends some sample data to the `tasks` endpoint using cURL:

```bash
curl -X POST "https://api.example.com/api/1.0/tasks" \  
    -H "Accept: application/json" \  
    -H "Authorization: Bearer ACCESS_TOKEN" \  
    -H "Content-Type: application/json" \  
    -d '{  
      "data": {  
      "workspace": "WORKSPACE_GID",  
      "name": "Sample task",  
      "assignee": "me"  
    }  
}'
```

{The above example code is a boilerplate so ensure you replace it with your own.}

### Response

The following is a sample JSON response from the API:

```bash
{
  "status": "success",  
  "message": "Task created successfully.",  
  "data": {  
    "id": "TASK_GID",  
    "workspace": "WORKSPACE_GID",  
    "name": "Sample task",  
    "assignee": {  
      "id": "USER_GID",  
      "name": "John Doe"  
    },  
  "created_at": "2025-02-01T12:00:00Z",  
  "updated_at": "2025-02-01T12:00:00Z",  
  "due_date": null,  
  "completed": false  
  }  
}
```

{The above example code is a boilerplate so ensure you replace it with your own.}

## Next steps

Congratulations on making your first API request! For additional information, check out the following resources:

* {Link to other relevant documentation such as API Reference}  
* {Link to other features that are available in the API}  
* {Provide links to additional tutorials and articles about the API}  
* {Provide links to community and support groups, FAQs, troubleshooting guides, etc.}

---

> Explore other templates from [The Good Docs Project](https://gitlab.com/tgdp/templates). Use our [feedback form](https://thegooddocsproject.dev/feedback/) to give feedback on this template. 
