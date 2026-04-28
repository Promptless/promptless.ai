# Template deliverables

This document explains the different file deliverables that template authors are required to write as part of each template project. First, read our [Template Contributing Guide](CONTRIBUTING.md) to understand the larger context for these deliverables.

## Table of contents

[TOC]

## Overview of each file

Currently, for a template project to be considered complete, each template project should have these documentation deliverables:

<table>
  <tr>
    <th>Deliverable</th>
    <th>Example filename and purpose</th>
    <th>Use case</th>
  </tr>
  <tr>
    <td>Template file</td>
    <td><strong>template_content-type.md</strong><br><br>The template file is the raw template for the content type. It provides a rough outline of the suggested content and a few embedded writing tips for how to fill in the different sections of the template.</td>
    <td>Used by <a href="https://tinyurl.com/tgdp-personas">Developer-Writer Darby</a> to create better documentation.<br><br>"Just give me something easy I can fill out and nothing more!"</td>
  </tr>
  <tr>
    <td>Template guide</td>
    <td><strong>guide_content-type.md</strong><br><br>This guide provides a deeper explanation of how to fill in the template. It provides a lightweight introduction to the purpose of this documentation and explains how to fill in each section of the document. Any information that is essential to filling out the template should be noted in this guide.</td>
    <td>Used by <a href="https://tinyurl.com/tgdp-personas">Developer-Writer Darby</a> to fill in the template.<br><br>"When I get stuck, I'll refer to the guide to help me out. Keep this guide simple and lightweight for me!"</td>
  </tr>
  <tr>
    <td>Resources</td>
    <td><strong>resources_content-type.md</strong><br><br>This document includes the resources (books, blog entries, guides) that the templateer used during the research phase of creating the template. The templateer can also include high quality examples of that content type that served as inspiration for the template. Template contributors should use this document to ethically cite their sources and give credit where credit is due, in harmony with our Code of Conduct.</td>
    <td>Used by <a href="https://tinyurl.com/tgdp-personas">Templateer Terry</a> to ethically cite sources. Also used by <a href="https://tinyurl.com/tgdp-personas">Doc System Owner Olly</a> to understand the theory that informs this template on a deeper level.<br><br>"If I want to customize this template for my project, I can use this document to make informed changes. If I need to maintain this template and make changes to it in the future, I can understand the thinking that went into the template originally."</td>
  </tr>
  <tr>
    <td>Process</td>
    <td><strong>process_content-type.md</strong><br><br>This document explains best practices for researching, writing, and maintaining this content type. As a minimum viable document, it can be very lightweight and include simple content about researching, writing, and maintaining that content type---such as a paragraph each. If a more detailed explanation is needed for that content type, it can go deeper.</td>
    <td>Used by <a href="https://tinyurl.com/tgdp-personas">Developer-Writer Darby</a> and <a href="https://tinyurl.com/tgdp-personas">Doc System Owner Olly</a> to learn about any unique challenges or best practices when writing this content type.<br><br>"Help me understand best practices and avoid common mistakes."</td>
  </tr>
  <tr>
    <td>Example</td>
    <td><strong>example_content-type.md</strong><br><br>After a template project is complete, our Chronologue working group will create an example of the template. While creating the example, the Chronologue group will test whether your template is user-friendly and can be used in a real documentation project. If you're still involved in the community during this phase, these team members might reach out to you for feedback or to collaborate on possible template revisions. NOTE: Examples are required, but they are created after the template writing process.</td>
    <td>Used by <a href="https://tinyurl.com/tgdp-personas">Developer-Writer Darby</a> and <a href="https://tinyurl.com/tgdp-personas">Doc System Owner Olly</a> to see what this content type looks like in a practical context.<br><br>"Help me see an example of this template in action so that I can see what 'good enough' looks like."</td>
  </tr>
</table>

Each template deliverable is explained in the following sections.

## Template file

Example filename: template_content-type.md

The template file is the basic template for the type of document you are creating.
It provides a rough outline of the suggested content and a few embedded writing tips for how to fill in the different sections of the template.
The template user will copy this template and begin filling it in or editing it as their starting point in the writing process.

### Content and formatting guidelines

Each template should have this content:

* **The template title** - The type of document this template is for. For example, "Tutorial template" or "README template."" This title should be formatted with the heading 1 weight.
* **Introductory comment** - Include an embedded writing tip at the start that tells users they should first read the accompanying template guide before they fill in the template. Put introductory comments in {curly brackets}.
* **The template sections** - Each section of the template should begin with a heading with the heading 2 weight. The recommended content and some embedded writing tips fall under the headings.
* **Embedded writing tips** - You can provide some lightweight writing tips that provide some tips or hints about what kind of content the template user might choose to put in a section of the document. Put embedded writing tips in {curly brackets}.

> :triangular_flag_on_post: **NOTE: The basic content of the template depends on the type of document you are creating a template for. Different types of documents can have widely varying content needs. While similar document types are likely to require similar structures, other document types may be structured quite differently.**

### Frequently asked questions

**Q: Is it better to include all the possible sections that someone could possibly include in the template file or should it just have the most common sections?**

A: While this is mostly a judgment call on your part as the template author, it might be better to err on the side of being comprehensive.
Don't forget that in your template guide you can indicate whether it is common or recommended to include this section or not.

**Q: Can I use heading 3 weights for sub-sections?**

A: Yes, but try not to go much deeper than level 3.

## Template guide

Example filename: guide_content-type.md

This guide provides a deeper explanation of how to fill in the template.
It provides a lightweight introduction to the purpose of this documentation and explains how to fill in each section of the document.

This guide explains the key decisions that the template user needs to make during the writing process.

This guide might also optionally include a checklist of the required components for this type of document.

### Content and formatting guidelines

The template guide should follow the same basic structure:

* **Template guide title** - The type of document this template is for and the words "guide." For example, "Tutorial guide" or "README guide." This title should be formatted with the heading 1 weight.
* **Introductory comment** - Include an embedded writing tip at the start that tells users they should first read this guide before they fill in the template. This comment could also mention how to get the template file. Put introductory comments in {curly brackets}.
* **Why do I need this type of document?** - Provide some of the information about the purpose of this type of document and how it helps your documentation project. The header for this section should be formatted with the heading 2 weight.
* **Content of this template** - This header marks the beginning of the part of the guide that explains how to fill in each section of the guide. It should be formatted with the heading 2 weight.
* **About the {insert section name here} section** - Next, include each section as they appear in the template with the heading 3 weight. For example, if your template includes a "Before you start" section, this heading should say "About the before your start section." And then it should provide guidance about what kind of content goes in that section and why that section might be included in the final document. If the section is optional, indicate why some documents could benefit from that section or why it might be left out. If the template user needs to make a decision about the content in that section, provide guidance about what should go into that section.

### Frequently asked questions

Q: No questions yet.

## Resources

Example filename: resources_content-type.md

This document includes the resources (books, blog entries, guides) that the templateer used during the research phase of creating the template. The templateer can also include high quality examples of that content type that served as inspiration for the template.

Template contributors should use this document to ethically cite their sources and give credit where credit is due, in harmony with our Code of Conduct.

The resources file has a number of advantages:

<table>
  <tr>
    <th>For the project</th>
    <td>It gives The Good Docs Project a way to ethically cite our sources and give credit where credit is due.</td>
  </tr>
  <tr>
    <th>For the template contributor</th>
    <td>It gives them a starting point and ending point (a goal + a final deliverable) for the research phase.</td>
  </tr>
  <tr>
    <th>For template readers who choose to read the process document</th>
    <td>It explains the theory behind why certain decisions were made to the template, which can help them understand why the template author made certain design decisions. It can also help them know how they can customize the template to their organization's needs.</td>
  </tr>
  <tr>
    <th>Future template maintainers</th>
    <td>This document helps them understand why a template was developed a certain way. It will help them decide whether to change the template in the future (or not).</td>
  </tr>
</table>

### Content and formatting guidelines

Each resource file should have the following sections:

* **Template title resources** - The type of document this template is for + "resources". For example, "Tutorial resources" or "README resources." This title should be formatted with the heading 1 weight.
* **Sources consulted** - Include a bulleted list or table of the sources you consulted while researching this template. Include a link and/or full citation so that others can find it. Explain how that source influenced the design decisions in your template.
* **Examples** - Include a bulleted list or table of the examples that served as inspiration for your template. Include a link and/or full citation so that others can find it.

### Frequently asked questions

Q: No questions yet.

## Process

Example filename: process_content-type.md

This document explains best practices for researching, writing, and maintaining this content type. As a minimum viable document, it can be very lightweight and include simple content about researching, writing, and maintaining that content type---such as a paragraph each. If a more detailed explanation is needed for that content type, it can go deeper.

### Content and formatting guidelines

Each resource file should have the following sections:

* **Template title process** - The type of document this template is for + "process". For example, "Tutorial process" or "README process." This title should be formatted with the heading 1 weight.
* **Researching "content type"** - Explain best practices for researching this content type.
* **Writing "content type"** - Explain recommendations for writing this content type.
* **Maintaining "content type** - Explain best practices for maintaining this content type over time, such as evaluating its effectiveness and keeping it up to date. It can also include knowing when to archive that content type if appropriate.

### Frequently asked questions

Q: No questions yet.

## Template example (optional)

Example filename: example_content.md

After a template project is complete, our Chronologue working group will create an example of the template. While creating the example, the Chronologue group will test whether your template is user-friendly and can be used in a real documentation project. If you're still involved in the community during this phase, these team members might reach out to you for feedback or to collaborate on possible template revisions.
