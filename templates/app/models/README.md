#Models
Ok, before you think database records, stop. If you want to interact with a database, take a look at `liquidfire:Spectre`
and its `entity` stytem. Models are used to house important "business logic" and can often times operate on an `Entity`.
Ok, neat, but what does that mean?

Lets use a scenario that involves a sergury center. They perform surgeries. We need to save the surgeries to the database, 
so we'll need to use an `Entity` for that. But, we also want to perform certain operations when a `surgery` is completed.
 
Here is a way this could look.

- `entities/surgery/Surgery.js`: Responsible for saving the surgery`s state. Maps one-to-one with a database record
- `entities/surgery/schema.json`: The schema of the database record. Its fields.
- `models/Surgery.js`: The class that does things when a surgery is started or completed
- `controllers/Admin.js`: The controller is what clients/end-users

