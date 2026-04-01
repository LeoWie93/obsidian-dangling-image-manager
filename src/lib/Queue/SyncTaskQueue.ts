import { Task } from "./Tasks";
import * as logger from "../Logger";

//TODO rewrite to use objects and not classes
export class SyncTaskQueue {
	queue: Task[] = [];
	locked: boolean = false;
	//TODO deadletter queue?

	enqueue(task: Task): void {
		this.queue.push(task);
		void this.dequeue();
	}

	async dequeue(): Promise<void> {
		if (this.locked) {
			return;
		}

		if (this.queue.length === 0) {
			return;
		}

		this.locked = true;

		const task: Task | undefined = this.queue.shift();

		if (task !== undefined) {
			try {
				if (task?.kind == 'async') {
					await task?.execute();
				} else {
					task?.execute();
				}
			} catch (e) {
				if (e instanceof Error) {
					logger.error("Task failed with error", { message: e.message });
				} else {
					logger.error("Task failed", { error: e });
				}
			}
		}

		this.locked = false;
		void this.dequeue();
	}
}

