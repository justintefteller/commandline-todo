#!/usr/bin/env node

const fs = require("fs");
const { program } = require("commander");
const { prompt } = require("inquirer");
const path = "C:/Users/18705/Cetec/CetecTodos/todos.json";

class Todos {
	constructor(filename) {
		if (!filename) throw new Error("Need a filename");

		this.filename = filename;
		try {
			fs.accessSync(this.filename);
		} catch (error) {
			fs.writeFileSync(this.filename, "[]");
		}
	}
	async getAll() {
		return JSON.parse(
			await fs.promises.readFile(this.filename, {
				encoding: "utf8",
			})
		);
	}

	async showAll() {
		const records = await this.getAll();
		for (let record of records) {
			console.log(record.id + ") " + record.Todo);
		}
	}

	async create(attrs) {
		attrs.id = await this.createId();
		const records = await this.getAll();
		records.push(attrs);
		await this.writeAll(records);
		await console.log("Added");
	}

	async writeAll(records) {
		await fs.promises.writeFile(
			this.filename,
			JSON.stringify(records, null, 2)
		);
	}

	async createId() {
		let id = 1;
		try {
			const records = await this.getAll();
			if (records.length == 0) {
				return id;
			}
			const ids = await records.map((rec) => rec.id);
			let id = ids.pop();
			return id + 1;
		} catch (err) {
			return id;
		}
	}

	async getOne(id) {
		const records = await this.getAll();
		return records.find((record) => record.id == id);
	}

	async delete(id) {
		const records = await this.getAll();
		const filtered = records.filter((record) => record.id != id);
		await this.writeAll(filtered);
		await console.log("Deleted");
	}

	async update(id, attrs) {
		const records = await this.getAll();
		const record = records.find((record) => record.id == id);

		if (!record) {
			throw new Error(`Record ${id} not found`);
		}
		Object.assign(record, attrs);
		await this.writeAll(records);
		await console.log("Updated");
	}

	async markOut(id) {
		const records = await this.getAll();
		const record = records.find((record) => record.id == id);
		if (!record) {
			throw new Error(`Record ${id} not found`);
		}

		const editedRecord = this.strikeThrough(record.Todo);
		Object.assign(record, {
			Todo: editedRecord,
		});
		await this.writeAll(records);
		await console.log("Marked out");
	}

	strikeThrough(text) {
		return text
			.split("")
			.map((char) => char + "\u0336")
			.join("");
	}
}

const todo = new Todos(path);

const questions = [
	{
		type: "input",
		name: "Todo",
		message: "Add todo",
	},
];

const updateQuestions = [
	{
		type: "input",
		name: "Id",
		message: "Which id do you want to update?",
	},
	{
		type: "input",
		name: "Todo",
		message: "What do you want to change the todo to?",
	},
];
const markOutQuestions = [
	{
		type: "input",
		name: "Id",
		message: "Which id do you want to markout?",
	},
];

const deleteQuestions = [
	{
		type: "input",
		name: "Id",
		message: "Which one do you want to delete?",
	},
];

const confirmDeleteQuestions = [
	{
		type: "confirm",
		name: "Answer",
		message: "Would you like to delete another one?",
		default: true,
	},
];
const confirmMarkoutQuestions = [
	{
		type: "confirm",
		name: "Answer",
		message: "Would you like to markout another one?",
		default: true,
	},
];
const confirmUpdateQuestions = [
	{
		type: "confirm",
		name: "Answer",
		message: "Would you like to update another one?",
		default: true,
	},
];
const confirmAddQuestions = [
	{
		type: "confirm",
		name: "Answer",
		message: "Would you like to update another one?",
		default: true,
	},
];
program
	.command("add")
	.alias("a")
	.description("Add Todo")
	.action(() => {
		prompt(questions).then(async (answers) => {
			await todo.create(answers);
			await repeat(confirmAddQuestions, questions);
		});
	});

program
	.command("show")
	.alias("s")
	.description("Show All Todos")
	.action(async () => {
		await todo.showAll();
	});

program
	.command("update")
	.alias("u")
	.description("Update A Single Todo")
	.action(async () => {
		await todo.showAll();
		await prompt(updateQuestions).then(async (answers) => {
			await todo.update(answers.Id, {
				Todo: answers.Todo,
			});
			await repeat(confirmUpdateQuestions, updateQuestions);
		});
	});

program
	.command("markout")
	.alias("m")
	.description("Strikethrough A Single Todo")
	.action(async () => {
		await todo.showAll();
		await prompt(markOutQuestions).then(async (answers) => {
			await todo.markOut(answers.Id);
			await repeat(confirmMarkoutQuestions, markOutQuestions);
		});
	});

program
	.command("delete")
	.alias("d")
	.description("Delete Todo")
	.action(async () => {
		await todo.showAll();
		await prompt(deleteQuestions).then(async (answers) => {
			await todo.delete(answers.Id);
			await repeat(confirmDeleteQuestions, deleteQuestions);
		});
	});

program.parse(process.argv);

function repeat(confirm, typeQs) {
	prompt(confirm).then(async (answer) => {
		if (answer.Answer == true) {
			await prompt(typeQs).then(async (answers) => {
				if (typeQs == deleteQuestions) {
					await todo.delete(answers.Id);
				} else if (typeQs == updateQuestions) {
					await todo.update(answers.Id, {
						Todo: answers.Todo,
					});
				} else if (typeQs == markOutQuestions) {
					await todo.markOut(answers.Id);
				} else if (typeQs == questions) {
					await todo.create(answers);
				}
			});
			await repeat(confirm, typeQs);
		}
	});
}
