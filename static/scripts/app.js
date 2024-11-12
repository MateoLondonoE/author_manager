// Variable global para controlar el estado de edición
let editingAuthorId = null;

// Cargar autores al iniciar la aplicación
async function fetchAuthors() {
    showLoading(); // Muestra el indicador
    try {
        const response = await fetch("/api/proxy-authors/");
        if (!response.ok) {
            throw new Error(`Error: ${response.status}`);
        }
        const authors = await response.json();

        updateFilterOptions(authors); // Actualiza las opciones del filtro
        const filterSelect = document.getElementById("filter-nationality");

        // Maneja cambios en el filtro
        filterSelect.addEventListener("change", () => {
            const filteredAuthors = filterAuthors(authors, filterSelect.value);
            displayAuthors(filteredAuthors); // Muestra autores filtrados
            calculateTotals(filteredAuthors); // Calcula totales con el filtro aplicado
        });

        // Muestra todos los autores inicialmente
        displayAuthors(authors);
        calculateTotals(authors);
    } catch (error) {
        console.error("Error fetching authors:", error);
    } finally {
        hideLoading(); // Oculta el indicador
    }
}

// Mostrar autores en la página
function displayAuthors(authors) {
    const authorList = document.getElementById("author-list");
    authorList.innerHTML = authors.map(author => `
        <div class="col-md-4">
            <div class="card shadow-sm">
                <div class="card-body">
                    <h5 class="card-title">${author.name}</h5>
                    <h6 class="card-subtitle text-muted">${author.nationality}</h6>
                    <p class="card-text mt-2">${author.biography}</p>
                    <button class="btn btn-warning btn-sm" onclick="editAuthor('${author.id}', '${author.name}', '${author.birthdate}', '${author.nationality}', '${author.biography}')">Edit</button>
                    <button class="btn btn-danger btn-sm" onclick="deleteAuthor('${author.id}')">Delete</button>
                </div>
            </div>
        </div>
    `).join("");
}

// Lógica para manejar el formulario
document.getElementById("author-form").addEventListener("submit", async (e) => {
    e.preventDefault();

    // Obtener datos del formulario
    const authorData = {
        name: document.getElementById("name").value,
        birthdate: document.getElementById("birthdate").value,
        nationality: document.getElementById("nationality").value,
        biography: document.getElementById("biography").value,
    };

    try {
        if (editingAuthorId) {
            // Editar autor existente
            const response = await fetch(`/api/proxy-authors/?id=${editingAuthorId}`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(authorData),
            });
            if (!response.ok) {
                throw new Error(`Error: ${response.status}`);
            }
            editingAuthorId = null; // Restablece el estado
            document.querySelector("#author-form button").textContent = "Add Author";
        } else {
            // Crear nuevo autor
            const response = await fetch("/api/proxy-authors/", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(authorData),
            });
            if (!response.ok) {
                throw new Error(`Error: ${response.status}`);
            }
        }
        fetchAuthors(); // Recarga la lista de autores
        fetchXML(); // Actualiza la vista XML
        document.getElementById("author-form").reset(); // Limpia el formulario
    } catch (error) {
        console.error("Error saving author:", error);
    }
});

// Editar un autor
function editAuthor(id, name, birthdate, nationality, biography) {
    // Rellenar el formulario con los datos del autor seleccionado
    document.getElementById("name").value = name;
    document.getElementById("birthdate").value = birthdate;
    document.getElementById("nationality").value = nationality;
    document.getElementById("biography").value = biography;

    // Cambiar el estado a edición
    editingAuthorId = id;

    // Cambiar el texto del botón
    document.querySelector("#author-form button").textContent = "Update Author";
}

// Eliminar un autor
async function deleteAuthor(authorId) {
    try {
        const response = await fetch(`/api/proxy-authors/?id=${authorId}`, {
            method: "DELETE",
            headers: {
                "Content-Type": "application/json",
            },
        });
        if (!response.ok) {
            throw new Error(`Error: ${response.status}`);
        }
        fetchAuthors(); // Recarga la lista de autores
        fetchXML(); // Actualiza la vista XML
    } catch (error) {
        console.error("Error deleting author:", error);
    }
}

// Cargar datos XML
async function fetchXML(filterValue = "all") {
    showLoading(); // Mostrar el indicador de carga
    try {
        let url = "http://127.0.0.1:8000/api/xml/";
        if (filterValue !== "all") {
            url += `?nationality=${filterValue}`; // Añadir el filtro a la URL
        }

        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`Error: ${response.status}`);
        }

        const xmlData = await response.text(); // Obtener el XML como texto
        const formattedXML = formatXML(xmlData); // Formatear el XML
        document.getElementById("xml-view").textContent = formattedXML; // Mostrar el XML formateado
    } catch (error) {
        console.error("Error fetching XML data:", error);
        document.getElementById("xml-view").textContent = "Failed to load XML data.";
    } finally {
        hideLoading(); // Ocultar el indicador de carga
    }
}


function formatXML(xmlString) {
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(xmlString, "application/xml");

    // Verificar si hubo errores en el parsing
    const parseError = xmlDoc.getElementsByTagName("parsererror");
    if (parseError.length) {
        console.error("Parsing error:", parseError[0].textContent);
        return "Invalid XML data received.";
    }

    // Formatear XML con sangrías y saltos de línea
    const serializer = new XMLSerializer();
    const xmlStringFormatted = serializer.serializeToString(xmlDoc);

    // Agregar saltos de línea y sangrías
    const formatted = xmlStringFormatted
        .replace(/></g, ">\n<") // Añade saltos de línea entre etiquetas
        .split("\n")
        .map((line, index) => {
            const indentLevel = (line.match(/<\/?[\w:.-]+>/g) || []).length - 1;
            return "  ".repeat(Math.max(indentLevel, 0)) + line;
        }) // Agrega sangrías
        .join("\n");

    return formatted;
}

function showLoading() {
    document.getElementById("loading-indicator").classList.remove("d-none");
}

function hideLoading() {
    document.getElementById("loading-indicator").classList.add("d-none");
}

function calculateTotals(authors) {
    const totalAuthors = authors.length; // Total de autores
    document.getElementById("total-authors").textContent = totalAuthors;

    // Ejemplo: Porcentaje de autores por nacionalidad
    const nationalityCount = authors.reduce((acc, author) => {
        acc[author.nationality] = (acc[author.nationality] || 0) + 1;
        return acc;
    }, {});

    const percentageInfo = Object.entries(nationalityCount)
        .map(([key, value]) => `${key}: ${((value / totalAuthors) * 100).toFixed(2)}%`)
        .join(", ");

    document.getElementById("percentage").textContent = percentageInfo;
}

function updateFilterOptions(authors) {
    const nationalities = [...new Set(authors.map(author => author.nationality))];
    const filterSelect = document.getElementById("filter-nationality");

    // Agrega opciones al selector
    filterSelect.innerHTML = '<option value="all">All</option>';
    nationalities.forEach(nat => {
        const option = document.createElement("option");
        option.value = nat;
        option.textContent = nat;
        filterSelect.appendChild(option);
    });
}

function filterAuthors(authors, filterValue) {
    if (filterValue === "all") {
        return authors;
    }
    return authors.filter(author => author.nationality === filterValue);
}

function filterXML(xmlString, filterValue) {
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(xmlString, "application/xml");

    const parseError = xmlDoc.getElementsByTagName("parsererror");
    if (parseError.length) {
        console.error("Parsing error:", parseError[0].textContent);
        return "Invalid XML data received.";
    }

    if (filterValue === "all") {
        return formatXML(xmlString);
    }

    const authors = xmlDoc.getElementsByTagName("author");
    const root = xmlDoc.createElement("authors");

    for (let author of authors) {
        const nationality = author.getElementsByTagName("nationality")[0]?.textContent;
        if (nationality === filterValue) {
            root.appendChild(author.cloneNode(true));
        }
    }

    if (root.children.length === 0) {
        console.warn("No authors match the filter criteria.");
        return `<authors><message>No authors match the filter criteria.</message></authors>`;
    }

    const serializer = new XMLSerializer();
    return formatXML(serializer.serializeToString(root));
}

const filterSelect = document.getElementById("filter-nationality");

filterSelect.addEventListener("change", () => {
    const filterValue = filterSelect.value;
    console.log("Selected filter value:", filterValue);
    fetchXML(filterValue); // Recargar el XML con el filtro aplicado
});

let authors = []; // Define `authors` como variable global
let xmlData = ""; // Define `xmlData` como variable global

async function fetchAuthorsAndXML() {
    showLoading();
    try {
        // Obtén los datos de los autores (JSON)
        const response = await fetch("/api/proxy-authors/");
        if (!response.ok) {
            throw new Error(`Error: ${response.status}`);
        }
        authors = await response.json(); // Asigna los datos a la variable global

        // Obtén los datos en formato XML
        const xmlResponse = await fetch("http://127.0.0.1:8000/api/xml/");
        if (!xmlResponse.ok) {
            throw new Error(`Error: ${xmlResponse.status}`);
        }
        xmlData = await xmlResponse.text(); // Asigna los datos a la variable global

        // Actualiza las opciones del filtro
        updateFilterOptions(authors);

        // Muestra todos los autores y el XML inicialmente
        displayAuthors(authors);
        calculateTotals(authors);
        const formattedXML = formatXML(xmlData);
        document.getElementById("xml-view").textContent = formattedXML;

        // Maneja cambios en el filtro
        const filterSelect = document.getElementById("filter-nationality");
        filterSelect.addEventListener("change", () => {
            const filterValue = filterSelect.value;
            console.log("Selected filter value:", filterValue); // Verifica el valor seleccionado

            const filteredAuthors = filterAuthors(authors, filterValue);
            displayAuthors(filteredAuthors); // Actualiza la lista de autores
            calculateTotals(filteredAuthors); // Calcula los totales con el filtro aplicado

            const filteredXML = filterXML(xmlData, filterValue);
            console.log("Updating XML view with filtered data."); // Confirma que el filtro se aplica
            document.getElementById("xml-view").textContent = filteredXML; // Actualiza la vista XML
        });
    } catch (error) {
        console.error("Error fetching authors and XML:", error);
    } finally {
        hideLoading();
    }
}

// Cargar autores y XML al inicio
fetchAuthors();
fetchXML();
